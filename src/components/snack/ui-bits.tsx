import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Bell, Home, Package, Settings, ShoppingBasket } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { describeDays, expiryStatus, statusLabel, type ExpiryStatus } from "@/lib/expiry";
import { useStore } from "@/lib/store";

const statusStyle: Record<ExpiryStatus, string> = {
  expired: "bg-destructive text-destructive-foreground",
  within1: "bg-destructive/15 text-destructive",
  within3: "bg-warn text-warn-foreground",
  within7: "bg-accent text-accent-foreground",
  ok: "bg-fresh/20 text-fresh",
  unknown: "bg-muted text-muted-foreground",
};

export function ExpiryBadge({ expiry, long }: { expiry?: string; long?: boolean }) {
  const s = expiryStatus(expiry);
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", statusStyle[s])}>
      {long ? describeDays(expiry) : s === "ok" ? describeDays(expiry) : statusLabel[s]}
    </span>
  );
}

export function DemoTag() {
  return <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">演示数据</span>;
}

export function PageHeader({ title, back, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-background/90 px-4 py-3 backdrop-blur">
      {back ? (
        <button aria-label="返回" onClick={() => router.history.back()} className="rounded-full p-1.5 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <span />
      )}
      <h1 className="truncate font-display text-2xl">{title}</h1>
      <div className="shrink-0">{right}</div>
    </header>
  );
}

export function Thumb({ photo, name, className }: { photo?: string; name: string; className?: string }) {
  return photo ? (
    <img src={photo} alt={name} className={cn("h-12 w-12 shrink-0 rounded-xl object-cover", className)} />
  ) : (
    <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary font-display text-xl text-secondary-foreground", className)}>
      {name.slice(0, 1)}
    </div>
  );
}

const tabs = [
  { to: "/", label: "首页", icon: Home },
  { to: "/inventory", label: "库存", icon: Package },
  { to: "/shop", label: "小卖部", icon: ShoppingBasket },
  { to: "/reminders", label: "提醒", icon: Bell },
  { to: "/settings", label: "设置", icon: Settings },
] as const;

export function BottomNav() {
  const { state } = useStore();
  const cartCount = state.cart.reduce((s, c) => s + c.qty, 0);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-2xl grid-cols-5">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="relative flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Icon className="h-5 w-5" />
            {label}
            {to === "/shop" && cartCount > 0 && (
              <span className="absolute right-[22%] top-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{cartCount}</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Loading() {
  return <div className="py-20 text-center text-muted-foreground">加载中…</div>;
}
