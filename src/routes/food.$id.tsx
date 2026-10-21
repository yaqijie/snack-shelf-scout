import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Info, Pencil, Plus, ShieldAlert, ShoppingBasket, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BatchFields, type BatchDraft } from "@/components/snack/BatchFields";
import { DemoTag, ExpiryBadge, Loading, PageHeader, Thumb } from "@/components/snack/ui-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toISODate } from "@/lib/expiry";
import { availableQty, checkAllergies } from "@/lib/inventory-rules";
import { actions, uid, useStore } from "@/lib/store";
import { confidenceLabel, sourceLabel, type Batch, type Nutrition } from "@/lib/types";

export const Route = createFileRoute("/food/$id")({
  validateSearch: z.object({ addBatch: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "食物详情 · Snack Home" },
      { name: "description", content: "查看配料、过敏原、营养成分、存放位置和各批次保质期。" },
      { property: "og:title", content: "食物详情 · Snack Home" },
      { property: "og:description", content: "配料、过敏原、营养与保质期。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detail,
});

const NUT: { k: keyof Nutrition; label: string; unit: string }[] = [
  { k: "energyKcal", label: "热量", unit: "kcal" },
  { k: "protein", label: "蛋白质", unit: "g" },
  { k: "fat", label: "脂肪", unit: "g" },
  { k: "carbs", label: "碳水化合物", unit: "g" },
  { k: "sugar", label: "糖", unit: "g" },
  { k: "sodiumMg", label: "钠", unit: "mg" },
];

function Detail() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { state, ready } = useStore();
  const [editing, setEditing] = useState<Batch | "new" | null>(search.addBatch ? "new" : null);
  if (!ready) return <Loading />;
  const p = state.products.find((x) => x.id === id);
  if (!p) return <div><PageHeader title="详情" back /><p className="py-10 text-center">找不到该食物</p></div>;
  const batches = state.batches.filter((b) => b.productId === id).sort((a, b) => (a.expiryDate ?? "9").localeCompare(b.expiryDate ?? "9"));
  const allergy = checkAllergies(p, state.settings);
  const kcal = p.perServing.energyKcal;
  const goal = state.settings.dailyCalorieGoal;
  const nutMissing = Object.keys(p.per100g).length === 0 && Object.keys(p.perServing).length === 0;

  return (
    <div className="space-y-4">
      <PageHeader title="食物详情" back right={<Link to="/food/$id/edit" params={{ id }} aria-label="编辑" className="rounded-full p-2 hover:bg-muted"><Pencil className="h-5 w-5" /></Link>} />
      <div className="flex items-center gap-4">
        <Thumb photo={p.photo} name={p.name} className="h-20 w-20 text-3xl" />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{p.brand ?? "无品牌"} · {p.category}</p>
          <h2 className="font-display text-3xl">{p.name}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
            {p.isDemo && <DemoTag />}
            <span className="rounded bg-muted px-1.5 py-0.5">{sourceLabel[p.source]}</span>
            <span className="rounded bg-muted px-1.5 py-0.5">{confidenceLabel[p.confidence]}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">条码 {p.barcode ?? "—"} · 规格 {p.packageSize ?? "—"} · 每份 {p.servingSize ?? "—"}</p>

      {allergy.level === "danger" && (
        <Notice tone="danger" icon={<ShieldAlert className="h-5 w-5" />}>可能含有你设置的过敏原：<b>{allergy.matches.join("、")}</b>。请勿食用或仔细核对包装。</Notice>
      )}
      {allergy.level === "unknown" && (
        <Notice tone="warn" icon={<AlertTriangle className="h-5 w-5" />}>配料和过敏原信息缺失，<b>无法判断</b>是否含有你的过敏原，请查看包装。</Notice>
      )}
      {allergy.level === "none" && <Notice tone="info" icon={<Info className="h-5 w-5" />}>{allergy.note}</Notice>}
      {allergy.level === "no-prefs" && (
        <Notice tone="info" icon={<Info className="h-5 w-5" />}>尚未设置过敏原。<Link to="/settings" className="underline">去设置</Link></Notice>
      )}

      <section className="card-soft p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">批次（{batches.filter((b) => b.quantity > 0).length} 个在库）</h3>
          <Button size="sm" variant="secondary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" />新批次</Button>
        </div>
        <ul className="divide-y">
          {batches.map((b) => (
            <li key={b.id} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{b.quantity > 0 ? `${b.quantity}${b.unit}` : "已吃完"} · {b.location}</p>
                <p className="text-xs text-muted-foreground">
                  到期 {b.expiryDate ?? "未知"}{b.purchaseDate ? ` · 购于 ${b.purchaseDate}` : ""}{b.openedDate ? ` · 开封 ${b.openedDate}` : ""}
                </p>
              </div>
              <ExpiryBadge expiry={b.expiryDate} />
              {b.quantity > 0 && (
                <button aria-label="加入购物车" className="rounded-full p-1.5 text-primary hover:bg-muted" disabled={availableQty(b, state.cart) <= 0}
                  onClick={() => { actions.addToCart(b.id, Math.min(1, availableQty(b, state.cart))); toast.success("已加入小卖部购物车"); }}>
                  <ShoppingBasket className="h-4 w-4" />
                </button>
              )}
              <button aria-label="编辑批次" className="rounded-full p-1.5 hover:bg-muted" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></button>
            </li>
          ))}
          {batches.length === 0 && <li className="py-3 text-sm text-muted-foreground">暂无批次</li>}
        </ul>
      </section>

      <section className="card-soft p-4">
        <h3 className="mb-2 font-semibold">配料</h3>
        <p className="text-sm">{p.ingredients?.trim() || <span className="text-muted-foreground">未录入配料信息</span>}</p>
        <h3 className="mb-2 mt-4 font-semibold">过敏原</h3>
        {p.allergens.length ? (
          <div className="flex flex-wrap gap-1.5">{p.allergens.map((a) => <span key={a} className="rounded-full bg-warn px-2 py-0.5 text-xs text-warn-foreground">{a}</span>)}</div>
        ) : <p className="text-sm text-muted-foreground">未录入（不代表不含过敏原）</p>}
      </section>

      <section className="card-soft p-4">
        <h3 className="mb-2 font-semibold">营养成分</h3>
        {nutMissing ? <p className="text-sm text-muted-foreground">未录入营养信息</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-muted-foreground"><th className="text-left font-normal">项目</th><th className="text-right font-normal">每100g</th><th className="text-right font-normal">每份</th></tr></thead>
            <tbody>
              {NUT.map(({ k, label, unit }) => (
                <tr key={k} className="border-t">
                  <td className="py-1.5">{label}</td>
                  <td className="text-right">{p.per100g[k] ?? "—"}{p.per100g[k] !== undefined && unit}</td>
                  <td className="text-right">{p.perServing[k] ?? "—"}{p.perServing[k] !== undefined && unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {kcal !== undefined && goal ? (
          <p className="mt-3 rounded-lg bg-muted p-2 text-sm">每份约占你每日 {goal} kcal 目标的 <b>{Math.round((kcal / goal) * 100)}%</b></p>
        ) : goal ? <p className="mt-3 text-xs text-muted-foreground">缺少每份热量，无法计算占每日目标的比例。</p> : null}
      </section>

      <Button variant="ghost" className="w-full text-destructive" onClick={() => {
        if (confirm(`删除「${p.name}」及其全部批次？`)) { actions.deleteProduct(p.id); navigate({ to: "/inventory" }); }
      }}><Trash2 className="h-4 w-4" />删除此食物</Button>

      <BatchDialog productId={p.id} editing={editing} onClose={() => { setEditing(null); if (search.addBatch) navigate({ to: "/food/$id", params: { id }, search: {}, replace: true }); }} />
    </div>
  );
}

function Notice({ tone, icon, children }: { tone: "danger" | "warn" | "info"; icon: React.ReactNode; children: React.ReactNode }) {
  const cls = tone === "danger" ? "bg-destructive/10 text-destructive" : tone === "warn" ? "bg-warn/40 text-warn-foreground" : "bg-muted text-foreground";
  return <div className={`flex gap-2 rounded-xl p-3 text-sm ${cls}`}><span className="shrink-0">{icon}</span><p>{children}</p></div>;
}

function BatchDialog({ productId, editing, onClose }: { productId: string; editing: Batch | "new" | null; onClose: () => void }) {
  return (
    <Dialog open={editing !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing === "new" ? "添加新批次" : "编辑批次"}</DialogTitle></DialogHeader>
        {editing !== null && <BatchEditor key={editing === "new" ? "new" : editing.id} productId={productId} editing={editing} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function BatchEditor({ productId, editing, onClose }: { productId: string; editing: Batch | "new"; onClose: () => void }) {
  const b = editing === "new" ? null : editing;
  const [d, setD] = useState<BatchDraft>({
    quantity: String(b?.quantity ?? 1), unit: b?.unit ?? "包", location: b?.location ?? "零食柜",
    purchaseDate: b?.purchaseDate ?? toISODate(new Date()), openedDate: b?.openedDate ?? "", expiryDate: b?.expiryDate ?? "",
  });
  const save = () => {
    const qty = parseFloat(d.quantity);
    if (Number.isNaN(qty) || qty < 0) return toast.error("请输入有效数量");
    const next: Batch = {
      id: b?.id ?? uid(), productId, createdAt: b?.createdAt ?? new Date().toISOString(),
      quantity: qty, unit: d.unit, location: d.location,
      purchaseDate: d.purchaseDate || undefined, openedDate: d.openedDate || undefined, expiryDate: d.expiryDate || undefined,
    };
    if (b) actions.updateBatch(next); else actions.addBatch(next);
    toast.success("批次已保存");
    onClose();
  };
  return (
    <div className="space-y-4">
      <BatchFields value={d} onChange={setD} />
      <div className="flex gap-2">
        {b && <Button variant="outline" className="text-destructive" onClick={() => { actions.deleteBatch(b.id); onClose(); }}>删除</Button>}
        <Button className="flex-1" onClick={save}>保存</Button>
      </div>
    </div>
  );
}
