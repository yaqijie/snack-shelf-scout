import { describe, expect, it } from "vitest";
import { applyPickup, checkAllergies } from "@/lib/inventory-rules";
import { expiryStatus } from "@/lib/expiry";
import type { Batch, Product } from "@/lib/types";

const batch: Batch = { id: "b", productId: "p", quantity: 5, unit: "包", location: "零食柜", createdAt: "" };

describe("pickup", () => {
  it("ate all deducts the picked quantity", () => expect(applyPickup(batch, 2, { kind: "all" })).toBe(3));
  it("ate some deducts only the eaten amount", () => expect(applyPickup(batch, 2, { kind: "some", eaten: 1 })).toBe(4));
  it("returned keeps quantity", () => expect(applyPickup(batch, 2, { kind: "returned" })).toBe(5));
});

describe("expiry", () => {
  const today = new Date(2026, 0, 10);
  it("tomorrow is within 1 day", () => expect(expiryStatus("2026-01-11", today)).toBe("within1"));
  it("3 days is within 3 days", () => expect(expiryStatus("2026-01-13", today)).toBe("within3"));
  it("yesterday is expired", () => expect(expiryStatus("2026-01-09", today)).toBe("expired"));
});

describe("allergies", () => {
  const p = { allergens: [], ingredients: "", per100g: {}, perServing: {} } as unknown as Product;
  it("missing ingredients is unknown, not safe", () =>
    expect(checkAllergies(p, { allergies: ["花生"], remindDays: [], inAppReminders: true }).level).toBe("unknown"));
});
