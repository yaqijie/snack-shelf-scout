export interface Nutrition {
  energyKcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  sugar?: number;
  sodiumMg?: number;
}

export type DataSource = "demo" | "manual" | "package" | "local-match";
export type Confidence = "high" | "medium" | "low";

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  brand?: string;
  category: string;
  packageSize?: string;
  servingSize?: string;
  ingredients?: string;
  allergens: string[];
  per100g: Nutrition;
  perServing: Nutrition;
  photo?: string; // data URL (local only)
  source: DataSource;
  confidence: Confidence;
  isDemo?: boolean;
  createdAt: string;
}

/** One physical purchase of a product. Batches are never merged so each keeps its own expiry. */
export interface Batch {
  id: string;
  productId: string;
  quantity: number;
  unit: string;
  location: string;
  purchaseDate?: string;
  openedDate?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface CartItem {
  batchId: string;
  qty: number;
}

export interface Settings {
  allergies: string[];
  dailyCalorieGoal?: number;
  avoidNotes?: string;
  remindDays: number[]; // e.g. [3, 1]
  inAppReminders: boolean;
}

export interface AppState {
  version: 1;
  products: Product[];
  batches: Batch[];
  cart: CartItem[];
  settings: Settings;
}

export type PickupOutcome = { kind: "all" } | { kind: "some"; eaten: number } | { kind: "returned" };

export const CATEGORIES = ["膨化食品", "饼干糕点", "饮料", "乳制品", "坚果果干", "糖果巧克力", "方便食品", "水果生鲜", "其他"];
export const LOCATIONS = ["零食柜", "冰箱冷藏", "冰箱冷冻", "厨房橱柜", "办公室", "其他"];
export const UNITS = ["包", "个", "瓶", "盒", "罐", "袋", "根", "g", "ml"];

export const sourceLabel: Record<DataSource, string> = {
  demo: "演示数据",
  manual: "手动录入",
  package: "按包装标签录入",
  "local-match": "本地已有商品",
};
export const confidenceLabel: Record<Confidence, string> = { high: "可信度高", medium: "可信度中", low: "可信度低" };
