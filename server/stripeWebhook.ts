import express from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripeWebhookRouter = express.Router();

// MUST use raw body for Stripe signature verification
stripeWebhookRouter.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    // If no Stripe key configured, skip
    if (!ENV.stripeSecretKey) {
      return res.json({ received: true });
    }

    const stripe = new Stripe(ENV.stripeSecretKey);

    let event: Stripe.Event;

    try {
      if (ENV.stripeWebhookSecret && sig) {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          ENV.stripeWebhookSecret
        );
      } else {
        // No webhook secret - parse directly (dev mode)
        event = JSON.parse(req.body.toString()) as Stripe.Event;
      }
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.user_id;
          const customerId = session.customer as string;

          if (userId) {
            const db = await getDb();
            if (!db) break;
            await db
              .update(users)
              .set({
                plan: "pro",
                stripeCustomerId: customerId,
                stripeSubscriptionId: session.subscription as string | null,
                subscriptionStatus: session.subscription ? "active" : undefined,
              })
              .where(eq(users.id, parseInt(userId)));
            console.log(`[Stripe] User ${userId} upgraded to Pro`);
          }
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;
          const status = sub.status as "active" | "canceled" | "past_due" | "trialing";

          const db2 = await getDb();
          if (!db2) break;
          await db2
            .update(users)
            .set({
              subscriptionStatus: status,
              plan: status === "active" || status === "trialing" ? "pro" : "free",
              stripeSubscriptionId: sub.id,
            })
            .where(eq(users.stripeCustomerId, customerId));
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;

          const db3 = await getDb();
          if (!db3) break;
          await db3
            .update(users)
            .set({
              plan: "free",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
            })
            .where(eq(users.stripeCustomerId, customerId));
          console.log(`[Stripe] Subscription canceled for customer ${customerId}`);
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      console.error("[Stripe Webhook] Error processing event:", err);
      return res.status(500).json({ error: "Webhook processing failed" });
    }

    res.json({ received: true });
  }
);

export default stripeWebhookRouter;
