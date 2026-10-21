import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { DemoTag, ExpiryBadge, Loading, PageHeader, Thumb } from "@/components/snack/ui-bits";
import { daysUntil, expiryStatus, statusLabel, type ExpiryStatus } from "@/lib/expiry";
import { useStore } from "@/lib/store";
import { CATEGORIES, LOCATIONS } from "@/lib/types";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "库存 · Snack Home" },
      { name: "description", content: "按分类、位置和保质期搜索筛选你的食物库存。" },
      { property: "og:title", content: "库存 · Snack Home" },
      { property: "og:description", content: "按分类、位置和保质期筛选食物批次。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const { state, ready } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [loc, setLoc] = useState("");
  const [st, setSt] = useState<"" | ExpiryStatus | "soon" | "finished">("");
  if (!ready) return <Loading />;
  const byId = new Map(state.products.map((p) => [p.id, p]));
  const rows = state.batches
    .filter((b) => {
      const p = byId.get(b.productId);
      if (!p) return false;
      if (st === "finished") return b.quantity <= 0;
      if (b.quantity <= 0) return false;
      const s = expiryStatus(b.expiryDate);
      if (st === "soon" && !["within1", "within3", "within7"].includes(s)) return false;
      if (st && st !== "soon" && s !== st) return false;
      if (cat && p.category !== cat) return false;
      if (loc && b.location !== loc) return false;
      const text = `${p.name}${p.brand ?? ""}${p.barcode ?? ""}`.toLowerCase();
      return !q || text.includes(q.toLowerCase());
    })
    .sort((a, b) => (a.expiryDate ? daysUntil(a.expiryDate) : 9999) - (b.expiryDate ? daysUntil(b.expiryDate) : 9999));

  return (
    <div>
      <PageHeader title="库存" right={<Link to="/food/new" aria-label="添加" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></Link>} />
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="field pl-9" placeholder="搜索名称、品牌或条码" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <select className="field text-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="分类">
          <option value="">全部分类</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field text-sm" value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="位置">
          <option value="">全部位置</option>{LOCATIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field text-sm" value={st} onChange={(e) => setSt(e.target.value as typeof st)} aria-label="保质期">
          <option value="">全部状态</option>
          <option value="soon">7天内到期</option>
          {(["expired", "within1", "within3", "ok", "unknown"] as ExpiryStatus[]).map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
          <option value="finished">已吃完</option>
        </select>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">共 {rows.length} 个批次 · 同一商品的不同批次分开显示，按到期先后排序</p>
      <ul className="space-y-2">
        {rows.map((b) => {
          const p = byId.get(b.productId)!;
          const sameCount = state.batches.filter((x) => x.productId === p.id && x.quantity > 0).length;
          return (
            <li key={b.id}>
              <Link to="/food/$id" params={{ id: p.id }} className="card-soft flex items-center gap-3 p-3">
                <Thumb photo={p.photo} name={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">{p.brand} {p.name}{p.isDemo && <DemoTag />}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.category} · {b.location} · {b.quantity}{b.unit}{sameCount > 1 ? ` · 共${sameCount}批` : ""}
                  </p>
                </div>
                <ExpiryBadge expiry={b.expiryDate} />
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">没有符合条件的食物</li>}
      </ul>
    </div>
  );
}
