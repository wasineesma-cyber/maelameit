import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Zap } from "lucide-react";

const LOGO_SQUARE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/logo-v2-square-MaCyTTeZrgjEEhYjASR82X.webp";

const SLIDES = [
  {
    id: 0,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/ob1-welcome-ecc7JgzN7RGxaXsQEsMpyw.webp",
    isLogin: false,
  },
  {
    id: 1,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/ob2-problem-YfJkTLaUrGCfGTFQrxuuZs.webp",
    isLogin: false,
  },
  {
    id: 2,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/ob3-solution-397J88StNdBuVUYovbopMG.webp",
    isLogin: false,
  },
  {
    id: 3,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/ob4-features-QiKCv97H2i7qC8P4JPty7E.webp",
    isLogin: false,
  },
  {
    id: 4,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/ob5-login-kBj5y3nJxKP5ya3iprharV.webp",
    isLogin: true,
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const [, setLocation] = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goNext = useCallback(() => {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    }
  }, [current]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1);
    }
  }, [current]);

  const skipToLogin = useCallback(() => {
    setCurrent(SLIDES.length - 1);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    // Only trigger horizontal swipe if horizontal movement > vertical
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      if (dx > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Tap anywhere on image area to go next (except login slide)
  const handleTap = () => {
    const slide = SLIDES[current];
    if (!slide.isLogin) {
      goNext();
    }
  };

  const slide = SLIDES[current];

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-bleed image */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleTap}
      >
        {SLIDES.map((s, i) => (
          <img
            key={s.id}
            src={s.image}
            alt={`slide ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-400"
            style={{
              opacity: i === current ? 1 : 0,
              pointerEvents: i === current ? "auto" : "none",
            }}
          />
        ))}
      </div>

      {/* Skip button - top right (only on non-login slides) */}
      {!slide.isLogin && (
        <button
          onClick={(e) => { e.stopPropagation(); skipToLogin(); }}
          className="absolute top-5 right-5 z-30 text-sm font-medium text-white px-4 py-1.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
        >
          ข้าม
        </button>
      )}

      {/* Dot indicators - bottom center */}
      <div
        className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "28px" : "8px",
              height: "8px",
              background: i === current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
              boxShadow: i === current ? "0 0 6px rgba(0,0,0,0.3)" : "none",
            }}
          />
        ))}
      </div>

      {/* Login overlay - only on last slide */}
      {slide.isLogin && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center px-6 pb-10 pt-8"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
          }}
        >
          {/* Logo small */}
          <img
            src={LOGO_SQUARE}
            alt="แม่ละเมียด"
            className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-white mb-4"
          />

          {/* Login button */}
          <a
            href={getLoginUrl()}
            className="w-full max-w-xs block"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-base font-bold shadow-xl"
              style={{
                background: "linear-gradient(135deg, #111111, #2a2a2a)",
              }}
            >
              <Zap className="w-5 h-5" />
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
          </a>

          <button
            className="mt-3 text-sm text-white/60 hover:text-white/90 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLocation("/dashboard"); }}
          >
            ทดลองดูก่อน (ไม่ login)
          </button>
        </div>
      )}
    </div>
  );
}
