import { LOCATIONS, UNITS } from "@/lib/types";

export interface BatchDraft {
  quantity: string;
  unit: string;
  location: string;
  purchaseDate: string;
  openedDate: string;
  expiryDate: string;
}

export function BatchFields({ value, onChange }: { value: BatchDraft; onChange: (v: BatchDraft) => void }) {
  const up = (k: keyof BatchDraft) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="数量 *">
        <input className="field" type="number" min="0" step="any" inputMode="decimal" value={value.quantity} onChange={up("quantity")} />
      </Field>
      <Field label="单位">
        <select className="field" value={value.unit} onChange={up("unit")}>
          {Array.from(new Set([value.unit, ...UNITS])).map((u) => <option key={u}>{u}</option>)}
        </select>
      </Field>
      <Field label="存放位置" full>
        <select className="field" value={value.location} onChange={up("location")}>
          {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="购买日期">
        <input className="field" type="date" value={value.purchaseDate} onChange={up("purchaseDate")} />
      </Field>
      <Field label="开封日期">
        <input className="field" type="date" value={value.openedDate} onChange={up("openedDate")} />
      </Field>
      <Field label="保质期至（到期日）" full>
        <input className="field" type="date" value={value.expiryDate} onChange={up("expiryDate")} />
      </Field>
    </div>
  );
}

export function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "col-span-2 block" : "block"}>
      <span className="mb-1 block text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
