import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { addLocalTransactions } from "@/lib/localLedger";
import { parseQuickEntryText } from "@/lib/localParser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Loader2,
  Menu,
  Send,
} from "lucide-react";

type ChatMessage =
  | { id: string; role: "user"; type: "text"; content: string; createdAt: number }
  | {
      id: string;
      role: "assistant";
      type: "parsed";
      content: string;
      items: ParsedItem[];
      createdAt: number;
    }
  | { id: string; role: "assistant"; type: "text"; content: string; createdAt: number };

interface ParsedItem {
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: number | null;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
  type: string | null;
}

function createId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";
  const key = "mae_lamiet_guest_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = `guest_${createId()}`;
  window.localStorage.setItem(key, next);
  return next;
}

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const lineUserId = (isAuthenticated && user?.openId ? user.openId : getOrCreateGuestId()) ?? "";

  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: createId(),
      role: "assistant",
      type: "text",
      content: "พิมพ์รายรับรายจ่ายได้เลย เช่น ‘ข้าว 80’, ‘เงินเดือน 25000’",
      createdAt: Date.now(),
    },
  ]);

  const listRef = useRef<HTMLDivElement>(null);

  const parseMessage = trpc.ai.parseMessage.useMutation();
  const createTx = trpc.transactions.create.useMutation();

  const { data: categories } = trpc.categories.list.useQuery(
    { lineUserId },
    { enabled: !!lineUserId && !isGuest }
  );

  const catMap = useMemo(() => {
    const map = new Map<number, Category>();
    (categories ?? []).forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const getCategoryIcon = (catId: number | null) => {
    if (!catId) return "📦";
    return catMap.get(catId)?.icon ?? "📦";
  };

  const getCategoryName = (catId: number | null) => {
    if (!catId) return "ไม่ระบุหมวด";
    return catMap.get(catId)?.name ?? "ไม่ระบุหมวด";
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isProcessing]);

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendText = async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    setInput("");
    pushMessage({ id: createId(), role: "user", type: "text", content: trimmed, createdAt: Date.now() });

    setIsProcessing(true);
    try {
      const result = isGuest
        ? { items: parseQuickEntryText(trimmed) }
        : await parseMessage.mutateAsync({ lineUserId, message: trimmed });
      if (result.items.length === 0) {
        pushMessage({
          id: createId(),
          role: "assistant",
          type: "text",
          content: "ยังแยกรายการไม่เจอค่ะ ลองพิมพ์ใหม่ เช่น ‘ข้าว 80’ หรือ ‘grab 120’",
          createdAt: Date.now(),
        });
      } else {
        pushMessage({
          id: createId(),
          role: "assistant",
          type: "parsed",
          content: `เจอ ${result.items.length} รายการค่ะ กดยืนยันเพื่อบันทึกได้เลย`,
          items: result.items,
          createdAt: Date.now(),
        });
      }
    } catch {
      pushMessage({
        id: createId(),
        role: "assistant",
        type: "text",
        content: "เกิดข้อผิดพลาด กรุณาลองใหม่ค่ะ",
        createdAt: Date.now(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmItems = async (items: ParsedItem[]) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (isGuest) {
        addLocalTransactions(
          lineUserId,
          items.map((item) => ({
            type: item.type,
            amount: item.amount,
            description: item.description,
            categoryId: item.categoryId,
            transactionDate: new Date().toISOString(),
            source: "local" as const,
          }))
        );
      } else {
        for (const item of items) {
          await createTx.mutateAsync({
            lineUserId,
            type: item.type,
            amount: item.amount,
            description: item.description,
            categoryId: item.categoryId ?? undefined,
            source: "web",
          });
        }
      }
      pushMessage({
        id: createId(),
        role: "assistant",
        type: "text",
        content: `บันทึก ${items.length} รายการแล้ว ✅`,
        createdAt: Date.now(),
      });
    } catch {
      pushMessage({
        id: createId(),
        role: "assistant",
        type: "text",
        content: "บันทึกไม่สำเร็จ กรุณาลองใหม่ค่ะ",
        createdAt: Date.now(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="container flex items-center gap-2.5 h-14 max-w-2xl mx-auto">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle>Mae Lamiet</SheetTitle>
                <SheetDescription>Navigate</SheetDescription>
              </SheetHeader>

              <div className="px-4 pb-4 space-y-1">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Money Chat", href: "/chat" },
                  { label: "Transactions", href: "/transactions" },
                  { label: "Analytics", href: "/analytics" },
                  { label: "Settings", href: "/settings" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <button
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent transition-colors text-sm text-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </button>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">Money Chat</h1>
            <div className="text-xs text-muted-foreground truncate">"A budget is telling your money where to go instead of wondering where it went."</div>
          </div>
        </div>
      </div>

      <div className="flex-1 container max-w-2xl mx-auto w-full px-0">
        <div ref={listRef} className="h-full overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    isUser
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-neutral-900 text-white px-4 py-2.5 shadow-sm"
                      : "max-w-[85%] rounded-2xl rounded-bl-md bg-white border border-neutral-200 px-4 py-2.5 shadow-sm"
                  }
                >
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>

                  {m.role === "assistant" && m.type === "parsed" && (
                    <div className="mt-3">
                      <Card className="border border-border shadow-none">
                        <CardContent className="p-3 space-y-2">
                          <div className="text-xs text-muted-foreground font-medium">
                            ตรวจพบ {m.items.length} รายการ
                          </div>
                          {m.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5 bg-secondary/40 rounded-xl px-3 py-2.5">
                              <span className="text-lg">{getCategoryIcon(item.categoryId)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{item.description}</div>
                                <div className="text-xs text-muted-foreground">{getCategoryName(item.categoryId)}</div>
                              </div>
                              <div
                                className="text-sm font-semibold flex-shrink-0 flex items-center gap-1 text-foreground"
                              >
                                {item.type === "income" ? (
                                  <ArrowUpCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownCircle className="w-3.5 h-3.5" />
                                )}
                                {item.type === "income" ? "+" : "-"}฿{item.amount.toLocaleString()}
                              </div>
                            </div>
                          ))}
                          <Button
                            className="w-full h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 gap-2 font-semibold"
                            onClick={() => void handleConfirmItems(m.items)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            ยืนยันบันทึก {m.items.length} รายการ
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white border border-neutral-200 px-4 py-2.5 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur border-t">
        <div className="container max-w-2xl mx-auto px-3 py-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์รายรับรายจ่าย เช่น ข้าว 80, เงินเดือน 25000"
            className="flex-1 resize-none text-sm bg-neutral-100 rounded-xl px-3 py-2.5 border border-neutral-200 outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 min-h-[44px] max-h-28 text-foreground placeholder:text-muted-foreground"
            rows={1}
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendText();
              }
            }}
          />

          <Button
            size="icon"
            className="h-11 w-11 rounded-xl flex-shrink-0 bg-neutral-900 hover:bg-neutral-800"
            onClick={() => void handleSendText()}
            disabled={isProcessing || !input.trim()}
            title="ส่ง"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
