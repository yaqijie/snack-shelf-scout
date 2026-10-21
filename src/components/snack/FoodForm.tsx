import { useNavigate } from "@tanstack/react-router";
import { Camera, ScanLine, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { actions, uid, useStore } from "@/lib/store";
import { toISODate } from "@/lib/expiry";
import { CATEGORIES, confidenceLabel, sourceLabel, type Confidence, type DataSource, type Nutrition, type Product } from "@/lib/types";
import { BatchFields, Field, type BatchDraft } from "./BatchFields";

const NUT_KEYS: { k: keyof Nutrition; label: string }[] = [
  { k: "energyKcal", label: "热量 kcal" },
  { k: "protein", label: "蛋白质 g" },
  { k: "fat", label: "脂肪 g" },
  { k: "carbs", label: "碳水 g" },
  { k: "sugar", label: "糖 g" },
  { k: "sodiumMg", label: "钠 mg" },
];

const schema = z.object({
  name: z.string().trim().min(1, "请填写名称").max(60, "名称最多60字"),
  barcode: z.string().trim().regex(/^\d{0,14}$/, "条码只能是最多14位数字"),
  brand: z.string().trim().max(40),
  ingredients: z.string().max(1000, "配料最多1000字"),
});

type NutDraft = Record<keyof Nutrition, string>;
const toNutDraft = (n: Nutrition): NutDraft =>
  Object.fromEntries(NUT_KEYS.map(({ k }) => [k, n[k] === undefined ? "" : String(n[k])])) as NutDraft;
const fromNutDraft = (d: NutDraft): Nutrition => {
  const out: Nutrition = {};
  NUT_KEYS.forEach(({ k }) => {
    const v = parseFloat(d[k]);
    if (!Number.isNaN(v) && v >= 0) out[k] = v;
  });
  return out;
};

async function resizeImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const max = 480;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * scale;
  c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.75);
}

export function FoodForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const { state } = useStore();
  const isEdit = !!product;
  const [f, setF] = useState({
    name: product?.name ?? "",
    barcode: product?.barcode ?? "",
    brand: product?.brand ?? "",
    category: product?.category ?? CATEGORIES[0],
    packageSize: product?.packageSize ?? "",
    servingSize: product?.servingSize ?? "",
    ingredients: product?.ingredients ?? "",
    allergens: product?.allergens.join("、") ?? "",
    source: (product?.source ?? "manual") as DataSource,
    confidence: (product?.confidence ?? "medium") as Confidence,
    photo: product?.photo,
  });
  const [p100, setP100] = useState(toNutDraft(product?.per100g ?? {}));
  const [pServ, setPServ] = useState(toNutDraft(product?.perServing ?? {}));
  const [batch, setBatch] = useState<BatchDraft>({
    quantity: "1", unit: "包", location: "零食柜", purchaseDate: toISODate(new Date()), openedDate: "", expiryDate: "",
  });
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const [match, setMatch] = useState<Product | null>(null);
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const lookup = () => {
    const code = f.barcode.trim();
    if (!code) return setLookupMsg("请先输入条码");
    const found = state.products.find((p) => p.barcode === code && p.id !== product?.id);
    if (found) {
      setMatch(found);
      setLookupMsg(`本地已有商品：${found.brand ?? ""}${found.name}`);
    } else {
      setMatch(null);
      setLookupMsg("本地未找到该条码。在线条码数据库尚未接入，请按包装手动填写。");
    }
  };

  const save = () => {
    const r = schema.safeParse(f);
    if (!r.success) return toast.error(r.error.issues[0].message);
    const allergens = f.allergens.split(/[、,，\s]+/).map((s) => s.trim()).filter(Boolean);
    const base: Product = {
      ...(product ?? { id: uid(), createdAt: new Date().toISOString() }),
      name: r.data.name,
      barcode: r.data.barcode || undefined,
      brand: r.data.brand || undefined,
      category: f.category,
      packageSize: f.packageSize.trim() || undefined,
      servingSize: f.servingSize.trim() || undefined,
      ingredients: f.ingredients.trim(),
      allergens,
      per100g: fromNutDraft(p100),
      perServing: fromNutDraft(pServ),
      photo: f.photo,
      source: f.source,
      confidence: f.confidence,
      isDemo: product?.isDemo && f.source === "demo",
    };
    if (isEdit) {
      actions.updateProduct(base);
      toast.success("已保存");
      navigate({ to: "/food/$id", params: { id: base.id } });
      return;
    }
    const qty = parseFloat(batch.quantity);
    if (!(qty > 0)) return toast.error("数量需大于0");
    actions.addProductWithBatch(base, {
      id: uid(), productId: base.id, quantity: qty, unit: batch.unit, location: batch.location,
      purchaseDate: batch.purchaseDate || undefined, openedDate: batch.openedDate || undefined,
      expiryDate: batch.expiryDate || undefined, createdAt: new Date().toISOString(),
    });
    toast.success("已加入库存");
    navigate({ to: "/food/$id", params: { id: base.id } });
  };

  return (
    <div className="space-y-4">
      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">条码</h2>
        <div className="flex gap-2">
          <input className="field" inputMode="numeric" placeholder="手动输入条码数字" value={f.barcode} onChange={up("barcode")} />
          <Button variant="secondary" onClick={lookup} type="button"><Search className="h-4 w-4" />查找</Button>
        </div>
        <Button variant="outline" type="button" disabled className="w-full">
          <ScanLine className="h-4 w-4" />摄像头扫码（尚未接入）
        </Button>
        {lookupMsg && <p className="rounded-lg bg-muted p-2 text-sm">{lookupMsg}</p>}
        {match && !isEdit && (
          <Button type="button" className="w-full" onClick={() => navigate({ to: "/food/$id", params: { id: match.id }, search: { addBatch: true } })}>
            为该商品添加新批次（保留各自保质期）
          </Button>
        )}
      </section>

      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">基本信息</h2>
        <div className="flex items-center gap-3">
          {f.photo ? <img src={f.photo} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-xl bg-muted"><Camera className="h-6 w-6 text-muted-foreground" /></div>}
          <div className="flex flex-col gap-1">
            <label className="cursor-pointer text-sm font-medium text-primary">
              {f.photo ? "更换照片" : "上传照片"}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setF({ ...f, photo: await resizeImage(file) });
              }} />
            </label>
            {f.photo && <button type="button" className="text-left text-sm text-muted-foreground" onClick={() => setF({ ...f, photo: undefined })}>移除照片</button>}
            <span className="text-xs text-muted-foreground">照片仅保存在本设备</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="名称 *" full><input className="field" value={f.name} onChange={up("name")} placeholder="如：原味薯片" /></Field>
          <Field label="品牌"><input className="field" value={f.brand} onChange={up("brand")} /></Field>
          <Field label="分类">
            <select className="field" value={f.category} onChange={up("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="包装规格"><input className="field" value={f.packageSize} onChange={up("packageSize")} placeholder="如：70g" /></Field>
          <Field label="每份份量"><input className="field" value={f.servingSize} onChange={up("servingSize")} placeholder="如：1包 30g" /></Field>
        </div>
      </section>

      {!isEdit && (
        <section className="card-soft space-y-3 p-4">
          <h2 className="font-semibold">本批次</h2>
          <BatchFields value={batch} onChange={setBatch} />
        </section>
      )}

      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">配料与过敏原</h2>
        <Field label="配料表"><textarea className="field min-h-20" value={f.ingredients} onChange={up("ingredients")} placeholder="按包装填写；留空表示未知" /></Field>
        <Field label="过敏原（用顿号或逗号分隔）"><input className="field" value={f.allergens} onChange={up("allergens")} placeholder="如：乳、小麦、花生" /></Field>
      </section>

      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">营养成分</h2>
        <div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-2 text-sm">
          <span /><span className="text-center text-muted-foreground">每100g</span><span className="text-center text-muted-foreground">每份</span>
          {NUT_KEYS.map(({ k, label }) => (
            <NutRow key={k} label={label} a={p100[k]} b={pServ[k]} onA={(v) => setP100({ ...p100, [k]: v })} onB={(v) => setPServ({ ...pServ, [k]: v })} />
          ))}
        </div>
      </section>

      <section className="card-soft space-y-3 p-4">
        <h2 className="font-semibold">数据来源</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="来源">
            <select className="field" value={f.source} onChange={up("source")}>
              {(Object.keys(sourceLabel) as DataSource[]).map((s) => <option key={s} value={s}>{sourceLabel[s]}</option>)}
            </select>
          </Field>
          <Field label="可信度">
            <select className="field" value={f.confidence} onChange={up("confidence")}>
              {(Object.keys(confidenceLabel) as Confidence[]).map((s) => <option key={s} value={s}>{confidenceLabel[s]}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <Button size="lg" className="w-full" onClick={save}>{isEdit ? "保存修改" : "加入库存"}</Button>
    </div>
  );
}

function NutRow({ label, a, b, onA, onB }: { label: string; a: string; b: string; onA: (v: string) => void; onB: (v: string) => void }) {
  return (
    <>
      <span>{label}</span>
      <input className="field px-2 text-center" inputMode="decimal" value={a} onChange={(e) => onA(e.target.value)} />
      <input className="field px-2 text-center" inputMode="decimal" value={b} onChange={(e) => onB(e.target.value)} />
    </>
  );
}
