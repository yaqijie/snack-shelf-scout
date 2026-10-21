// Local data store. Every read/write goes through this module, so a cloud
// database can replace `loadState`/`saveState` (and the actions) later without touching pages.
import { useSyncExternalStore } from "react";
import { makeDemoState } from "./demo-data";
import { applyPickup } from "./inventory-rules";
import type { AppState, Batch, PickupOutcome, Product, Settings } from "./types";

const KEY = "snack-home:v1";
const EMPTY: AppState = {
  version: 1,
  products: [],
  batches: [],
  cart: [],
  settings: { allergies: [], remindDays: [3, 1], inAppReminders: true },
};

let state: AppState = EMPTY;
let ready = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* corrupted storage: fall back to demo */
  }
  return makeDemoState();
}
function saveState(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    alert("本地存储空间不足，可能是照片太多。请删除部分照片后重试。");
  }
}
function set(fn: (s: AppState) => AppState) {
  state = fn(state);
  saveState(state);
  emit();
}

/** Call once on the client (from the root layout effect). */
export function initStore() {
  if (ready) return;
  state = loadState();
  ready = true;
  saveState(state);
  emit();
}

let snapshot = { state, ready };
function getSnapshot() {
  if (snapshot.state !== state || snapshot.ready !== ready) snapshot = { state, ready };
  return snapshot;
}
const serverSnapshot = { state: EMPTY, ready: false };

export function useStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot,
    () => serverSnapshot,
  );
}

export const uid = () => crypto.randomUUID();

export const actions = {
  addProductWithBatch(p: Product, b: Batch) {
    set((s) => ({ ...s, products: [...s.products, p], batches: [...s.batches, b] }));
  },
  updateProduct(p: Product) {
    set((s) => ({ ...s, products: s.products.map((x) => (x.id === p.id ? p : x)) }));
  },
  deleteProduct(id: string) {
    set((s) => {
      const batchIds = new Set(s.batches.filter((b) => b.productId === id).map((b) => b.id));
      return {
        ...s,
        products: s.products.filter((p) => p.id !== id),
        batches: s.batches.filter((b) => b.productId !== id),
        cart: s.cart.filter((c) => !batchIds.has(c.batchId)),
      };
    });
  },
  addBatch(b: Batch) {
    set((s) => ({ ...s, batches: [...s.batches, b] }));
  },
  updateBatch(b: Batch) {
    set((s) => ({ ...s, batches: s.batches.map((x) => (x.id === b.id ? b : x)) }));
  },
  deleteBatch(id: string) {
    set((s) => ({ ...s, batches: s.batches.filter((b) => b.id !== id), cart: s.cart.filter((c) => c.batchId !== id) }));
  },
  addToCart(batchId: string, qty = 1) {
    set((s) => {
      const existing = s.cart.find((c) => c.batchId === batchId);
      const cart = existing
        ? s.cart.map((c) => (c.batchId === batchId ? { ...c, qty: c.qty + qty } : c))
        : [...s.cart, { batchId, qty }];
      return { ...s, cart };
    });
  },
  setCartQty(batchId: string, qty: number) {
    set((s) => ({
      ...s,
      cart: qty <= 0 ? s.cart.filter((c) => c.batchId !== batchId) : s.cart.map((c) => (c.batchId === batchId ? { ...c, qty } : c)),
    }));
  },
  clearCart() {
    set((s) => ({ ...s, cart: [] }));
  },
  /** Resolve each picked-up cart line, adjusting only the exact batch it came from. */
  resolvePickup(outcomes: Record<string, PickupOutcome>) {
    set((s) => {
      const batches = s.batches.map((b) => {
        const line = s.cart.find((c) => c.batchId === b.id);
        const o = outcomes[b.id];
        if (!line || !o) return b;
        return { ...b, quantity: applyPickup(b, line.qty, o) };
      });
      return { ...s, batches, cart: [] };
    });
  },
  updateSettings(patch: Partial<Settings>) {
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  resetToDemo() {
    set(() => makeDemoState());
  },
  clearDemo() {
    set((s) => {
      const demoIds = new Set(s.products.filter((p) => p.isDemo).map((p) => p.id));
      const batches = s.batches.filter((b) => !demoIds.has(b.productId));
      const ids = new Set(batches.map((b) => b.id));
      return { ...s, products: s.products.filter((p) => !p.isDemo), batches, cart: s.cart.filter((c) => ids.has(c.batchId)) };
    });
  },
};
