import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBasket, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExpiryBadge, Loading, PageHeader, Thumb } from "@/components/snack/ui-bits";
import { Button } from "@/components/ui/button";
import { daysUntil, expiryStatus } from "@/lib/expiry";
import { availableQty } from "@/lib/inventory-rules";
import { actions, useStore } from "@/lib/store";
import type { PickupOutcome } from "@/lib/types";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "家庭小卖部 · Snack Home" },
      { name: "description", content: "从自家库存里挑零食，取货后记录吃完、吃了一部分或放回。" },
      { property: "og:title", content: "家庭小卖部 · Snack Home" },
      { property: "og:description", content: "模拟小卖部取零食，自动扣减正确批次。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shop,
});

type Draft = { kind: "all" | "some" | "returned"; eaten: string };

function Shop() {
  const { state, ready } = useStore();
  const [step, setStep] = useState<"browse" | "checkout" | "resolve">("browse");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  if (!ready) return <Loading />;
  const byP = new Map(state.products.map((p) => [p.id, p]));
  const byB = new Map(state.batches.map((b) => [b.id, b]));
  const shelf = state.batches
    .filter((b) => b.quantity > 0 && expiryStatus(b.expiryDate) !== "expired" && byP.has(b.productId))
    .sort((a, b) => (a.expiryDate ? daysUntil(a.expiryDate) : 9999) - (b.expiryDate ? daysUntil(b.expiryDate) : 9999));
  const cart = state.cart.filter((c) => byB.has(c.batchId));
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const kcal = cart.reduce((s, c) => s + (byP.get(byB.get(c.batchId)!.productId)?.perServing.energyKcal ?? 0) * c.qty, 0);
  const kcalUnknown = cart.some((c) => byP.get(byB.get(c.batchId)!.productId)?.perServing.energyKcal === undefined);

  const finish = () => {
    const outcomes: Record<string, PickupOutcome> = {};
    for (const c of cart) {
      const d = drafts[c.batchId];
      if (!d) return toast.error("请为每件商品选择处理方式");
      if (d.kind === "some") {
        const n = parseFloat(d.eaten);
        if (!(n > 0 && n <= c.qty)) return toast.error(`「吃了一部分」请填写 0~${c.qty} 之间的数量`);
        outcomes[c.batchId] = { kind: "some", eaten: n };
      } else outcomes[c.batchId] = { kind: d.kind };
    }
    actions.resolvePickup(outcomes);
    setDrafts({});
    setStep("browse");
    toast.success("库存已更新");
  };

  if (step === "checkout" || step === "resolve") {
    return (
      <div className="space-y-4">
        <PageHeader title={step === "checkout" ? "结算确认" : "取货后记录"} back={false}
          right={<Button size="sm" variant="ghost" onClick={() => setStep("browse")}>返回</Button>} />
        {step === "resolve" && <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">这些零食怎么样了？只有确认后才会扣减对应批次的库存。</p>}
        <ul className="space-y-2">
          {cart.map((c) => {
            const b = byB.get(c.batchId)!;
            const p = byP.get(b.productId)!;
            const d = drafts[c.batchId];
            return (
              <li key={c.batchId} className="card-soft p-3">
                <div className="flex items-center gap-3">
                  <Thumb photo={p.photo} name={p.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.brand} {p.name}</p>
                    <p className="text-xs text-muted-foreground">取 {c.qty}{b.unit} · {b.location} · 到期 {b.expiryDate ?? "未知"}</p>
                  </div>
                  <ExpiryBadge expiry={b.expiryDate} />
                </div>
                {step === "resolve" && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {([["all", "全吃完"], ["some", "吃了一部分"], ["returned", "放回去"]] as const).map(([k, label]) => (
                        <Button key={k} size="sm" variant={d?.kind === k ? "default" : "outline"}
                          onClick={() => setDrafts({ ...drafts, [c.batchId]: { kind: k, eaten: d?.eaten ?? "" } })}>{label}</Button>
                      ))}
                    </div>
                    {d?.kind === "some" && (
                      <label className="flex items-center gap-2 text-sm">吃了
                        <input className="field w-24" type="number" min="0" max={c.qty} step="any" value={d.eaten}
                          onChange={(e) => setDrafts({ ...drafts, [c.batchId]: { ...d, eaten: e.target.value } })} />
                        {b.unit}（其余放回）
                      </label>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {step === "checkout" ? (
          <>
            <div className="card-soft space-y-1 p-4 text-sm">
              <p className="flex justify-between"><span>件数</span><b>{cartCount}</b></p>
              <p className="flex justify-between"><span>预估热量（按每份）</span><b>{kcal} kcal{kcalUnknown && "+"}</b></p>
              {kcalUnknown && <p className="text-xs text-muted-foreground">部分商品缺少每份热量数据，未计入。</p>}
              <p className="text-xs text-muted-foreground">这是模拟结算，不涉及付款。</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep("resolve")}>确认取货</Button>
          </>
        ) : (
          <Button size="lg" className="w-full" onClick={finish}>完成并更新库存</Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="家庭小卖部" />
      <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground"><Store className="h-4 w-4" />货架按到期先后排列，先吃快到期的。已过期的不上架。</p>
      <ul className="space-y-2">
        {shelf.map((b) => {
          const p = byP.get(b.productId)!;
          const avail = availableQty(b, state.cart);
          return (
            <li key={b.id} className="card-soft flex items-center gap-3 p-3">
              <Link to="/food/$id" params={{ id: p.id }}><Thumb photo={p.photo} name={p.name} /></Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">可取 {avail}{b.unit} · {b.location}</p>
                <div className="mt-1"><ExpiryBadge expiry={b.expiryDate} long /></div>
              </div>
              <Button size="icon" aria-label={`把${p.name}加入购物车`} disabled={avail < 1} onClick={() => actions.addToCart(b.id, 1)}><Plus className="h-4 w-4" /></Button>
            </li>
          );
        })}
        {shelf.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">货架空空，<Link to="/food/new" className="text-primary">去添加食物</Link></li>}
      </ul>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 px-4">
          <div className="card-soft mx-auto max-w-2xl p-3">
            <div className="mb-2 max-h-40 space-y-1.5 overflow-auto">
              {cart.map((c) => {
                const b = byB.get(c.batchId)!;
                const p = byP.get(b.productId)!;
                return (
                  <div key={c.batchId} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{p.name} <span className="text-xs text-muted-foreground">({b.expiryDate ?? "无到期日"})</span></span>
                    <button aria-label="减少" className="rounded-full border p-1" onClick={() => actions.setCartQty(c.batchId, c.qty - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center">{c.qty}</span>
                    <button aria-label="增加" className="rounded-full border p-1 disabled:opacity-40" disabled={availableQty(b, state.cart) < 1} onClick={() => actions.setCartQty(c.batchId, c.qty + 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => actions.clearCart()}>清空</Button>
              <Button className="flex-1" onClick={() => setStep("checkout")}><ShoppingBasket className="h-4 w-4" />去结算（{cartCount}）</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
