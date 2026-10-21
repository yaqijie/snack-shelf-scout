import { createFileRoute, Link } from "@tanstack/react-router";
import { ExpiryBadge, Loading, PageHeader, Thumb } from "@/components/snack/ui-bits";
import { daysUntil } from "@/lib/expiry";
import { useStore } from "@/lib/store";
import type { Batch } from "@/lib/types";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "临期提醒 · Snack Home" },
      { name: "description", content: "1天内和3天内到期的食物一目了然，日期按今天实时计算。" },
      { property: "og:title", content: "临期提醒 · Snack Home" },
      { property: "og:description", content: "1天和3天内到期食物提醒。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reminders,
});

function Reminders() {
  const { state, ready } = useStore();
  if (!ready) return <Loading />;
  const today = new Date();
  const active = state.batches.filter((b) => b.quantity > 0 && b.expiryDate);
  const d = (b: Batch) => daysUntil(b.expiryDate!, today);
  const sort = (a: Batch, b: Batch) => d(a) - d(b);
  const groups = [
    { title: "已过期", hint: "建议检查后处理", items: active.filter((b) => d(b) < 0).sort(sort) },
    { title: "1天内到期", hint: "今天或明天", items: active.filter((b) => d(b) >= 0 && d(b) <= 1).sort(sort) },
    { title: "3天内到期", hint: "2~3天后", items: active.filter((b) => d(b) >= 2 && d(b) <= 3).sort(sort) },
  ];
  const byP = new Map(state.products.map((p) => [p.id, p]));
  const noDate = state.batches.filter((b) => b.quantity > 0 && !b.expiryDate).length;

  return (
    <div className="space-y-5">
      <PageHeader title="临期提醒" />
      <p className="text-sm text-muted-foreground">
        今天是 {today.toLocaleDateString("zh-CN")}。提醒只在打开本应用时显示，手机推送通知尚未接入。
      </p>
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="mb-2 font-semibold">{g.title} <span className="text-sm font-normal text-muted-foreground">· {g.hint} · {g.items.length}</span></h2>
          {g.items.length === 0 ? <p className="text-sm text-muted-foreground">无</p> : (
            <ul className="space-y-2">
              {g.items.map((b) => {
                const p = byP.get(b.productId);
                if (!p) return null;
                return (
                  <li key={b.id}>
                    <Link to="/food/$id" params={{ id: p.id }} className="card-soft flex items-center gap-3 p-3">
                      <Thumb photo={p.photo} name={p.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.brand} {p.name}</p>
                        <p className="text-xs text-muted-foreground">{b.quantity}{b.unit} · {b.location} · {b.expiryDate}</p>
                      </div>
                      <ExpiryBadge expiry={b.expiryDate} long />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
      {noDate > 0 && <p className="rounded-xl bg-muted p-3 text-sm">有 {noDate} 个批次未填写保质期，无法提醒。<Link to="/inventory" className="text-primary">去库存查看</Link></p>}
    </div>
  );
}
