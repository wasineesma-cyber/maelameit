import { useLocation, Link } from "wouter";
import { Home, List, BarChart2, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  onAddClick: () => void;
}

export function Layout({ children, onAddClick }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "หน้าแรก", icon: Home },
    { href: "/transactions", label: "รายการ", icon: List },
    { href: "/analytics", label: "วิเคราะห์", icon: BarChart2 },
    { href: "/settings", label: "ตั้งค่า", icon: Settings },
  ];

  // Split into left and right of FAB
  const leftNav = navItems.slice(0, 2);
  const rightNav = navItems.slice(2);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative">
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 z-40">
        <div className="flex items-end justify-around px-2 pt-2 pb-5">
          {leftNav.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <button
                  className={cn(
                    "flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-colors",
                    active ? "text-rose-600" : "text-slate-400"
                  )}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className="transition-all" />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              </Link>
            );
          })}

          {/* FAB */}
          <button
            onClick={onAddClick}
            className="flex items-center justify-center w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-300/50 -mt-7 active:scale-95 transition-all hover:bg-rose-700 flex-shrink-0"
            aria-label="เพิ่มรายการ"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>

          {rightNav.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <button
                  className={cn(
                    "flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-colors",
                    active ? "text-rose-600" : "text-slate-400"
                  )}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className="transition-all" />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
