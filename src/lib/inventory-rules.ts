import type { Batch, CartItem, PickupOutcome, Product, Settings } from "./types";

/** Returns the new batch quantity after a pickup is resolved. Only eaten amounts are deducted. */
export function applyPickup(batch: Batch, cartQty: number, outcome: PickupOutcome): number {
  let eaten = 0;
  if (outcome.kind === "all") eaten = cartQty;
  else if (outcome.kind === "some") eaten = Math.min(Math.max(outcome.eaten, 0), cartQty);
  return Math.max(0, +(batch.quantity - eaten).toFixed(2));
}

export function availableQty(batch: Batch, cart: CartItem[]): number {
  const reserved = cart.filter((c) => c.batchId === batch.id).reduce((s, c) => s + c.qty, 0);
  return Math.max(0, batch.quantity - reserved);
}

export type AllergyCheck =
  | { level: "danger"; matches: string[] }
  | { level: "unknown" }
  | { level: "none"; note: string }
  | { level: "no-prefs" };

/** Cautious check: never claims "safe"; missing data is reported as unknown. */
export function checkAllergies(p: Product, s: Settings): AllergyCheck {
  const prefs = s.allergies.map((a) => a.trim()).filter(Boolean);
  if (prefs.length === 0) return { level: "no-prefs" };
  const haystack = `${p.ingredients ?? ""} ${p.allergens.join(" ")}`;
  const matches = prefs.filter((a) => haystack.includes(a));
  if (matches.length) return { level: "danger", matches };
  if (!p.ingredients?.trim() && p.allergens.length === 0) return { level: "unknown" };
  return { level: "none", note: "已录入信息中未发现你的过敏原，但信息可能不完整，请以包装为准。" };
}
