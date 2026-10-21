import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Plus, ShoppingBasket } from "lucide-react";
import { DemoTag, ExpiryBadge, Loading, Thumb } from "@/components/snack/ui-bits";
import { daysUntil, expiryStatus } from "@/lib/expiry";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snack Home 零食之家 · 首页" },
      { name: "description", content: "一眼看清家里还有什么零食、哪些快过期。" },
      { property: "og:title", content: "Snack Home 零食之家" },
      { property: "og:description", content: "个人零食与食物库存管理，临期提醒与饮食偏好。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const { state, ready } = useStore();
  if (!ready) return <Loading />;
  const active = state.batches.filter((b) => b.quantity > 0);
  const byId = new Map(state.products.map((p) => [p.id, p]));
  const soon = active
    .filter((b) => ["expired", "within1", "within3"].includes(expiryStatus(b.expiryDate)))
    .sort((a, b) => daysUntil(a.expiryDate!) - daysUntil(b.expiryDate!));
  const hasDemo = state.products.some((p) => p.isDemo);
  const productCount = new Set(active.map((b) => b.productId)).size;

  return (
    <div className="space-y-5 pt-5">
      <div>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</p>
        <h1 className="font-display text-4xl text-primary">Snack Home</h1>
      </div>
      {hasDemo && (
        <div className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">
          当前包含 <b>演示数据</b>，可在「设置」中清除后录入你自己的食物。
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <Stat n={productCount} label="种食物" />
        <Stat n={active.length} label="个批次" />
        <Stat n={soon.length} label="临期/过期" danger={soon.length > 0} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Quick to="/food/new" icon={<Plus />} label="添加食物" primary />
        <Quick to="/shop" icon={<ShoppingBasket />} label="去小卖部" />
        <Quick to="/reminders" icon={<Bell />} label="看提醒" />
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-4 w-4 text-destructive" />3天内到期 / 已过期</h2>
        {soon.length === 0 ? (
          <p className="card-soft p-4 text-sm text-muted-foreground">太好了，近3天没有要到期的食物。</p>
        ) : (
          <ul className="space-y-2">
            {soon.map((b) => {
              const p = byId.get(b.productId)!;
              return (
                <li key={b.id}>
                  <Link to="/food/$id" params={{ id: p.id }} className="card-soft flex items-center gap-3 p-3">
                    <Thumb photo={p.photo} name={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.brand} {p.name}</p>
                      <p className="text-xs text-muted-foreground">{b.location} · {b.quantity}{b.unit}</p>
                    </div>
                    <ExpiryBadge expiry={b.expiryDate} long />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">当前库存</h2>
          <Link to="/inventory" className="text-sm text-primary">全部 →</Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {state.products.filter((p) => active.some((b) => b.productId === p.id)).slice(0, 6).map((p) => {
            const qty = active.filter((b) => b.productId === p.id);
            return (
              <Link key={p.id} to="/food/$id" params={{ id: p.id }} className="card-soft flex items-center gap-2 p-2.5">
                <Thumb photo={p.photo} name={p.name} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">{qty.reduce((s, b) => s + b.quantity, 0)}{qty[0].unit}{p.isDemo && <DemoTag />}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label, danger }: { n: number; label: string; danger?: boolean }) {
  return (
    <div className="card-soft p-3 text-center">
      <p className={danger ? "font-display text-3xl text-destructive" : "font-display text-3xl"}>{n}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Quick({ to, icon, label, primary }: { to: "/food/new" | "/shop" | "/reminders"; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link to={to} className={primary ? "flex flex-col items-center gap-1 rounded-2xl bg-primary p-3 text-sm font-medium text-primary-foreground shadow-soft" : "card-soft flex flex-col items-center gap-1 p-3 text-sm font-medium"}>
      {icon}{label}
    </Link>
  );
}
