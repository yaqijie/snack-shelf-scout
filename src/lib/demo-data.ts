import { addDays } from "./expiry";
import type { AppState, Batch, Product } from "./types";

// Demo data: expiry dates are computed relative to the day the demo is created.
export function makeDemoState(): AppState {
  const today = new Date();
  const now = new Date().toISOString();
  const P = (p: Omit<Product, "createdAt" | "isDemo" | "source" | "confidence"> & Partial<Product>): Product => ({
    source: "demo",
    confidence: "medium",
    isDemo: true,
    createdAt: now,
    ...p,
  });
  const products: Product[] = [
    P({ id: "d-lays", name: "原味薯片", brand: "乐事", barcode: "6924743915763", category: "膨化食品", packageSize: "70g", servingSize: "1包 70g",
      ingredients: "马铃薯、植物油、食用盐、麦芽糊精", allergens: [], per100g: { energyKcal: 548, protein: 6.5, fat: 34.2, carbs: 53.1, sugar: 1.2, sodiumMg: 520 }, perServing: { energyKcal: 384, protein: 4.6, fat: 23.9, carbs: 37.2, sodiumMg: 364 } }),
    P({ id: "d-oreo", name: "原味夹心饼干", brand: "奥利奥", barcode: "6901668053107", category: "饼干糕点", packageSize: "97g", servingSize: "3块 29g",
      ingredients: "小麦粉、白砂糖、植物油、可可粉、乳清粉、大豆卵磷脂", allergens: ["小麦", "乳", "大豆"], per100g: { energyKcal: 480, protein: 5.4, fat: 20, carbs: 70, sugar: 38, sodiumMg: 360 }, perServing: { energyKcal: 139, protein: 1.6, fat: 5.8, carbs: 20.3, sugar: 11 } }),
    P({ id: "d-wangzai", name: "旺仔牛奶", brand: "旺旺", barcode: "6920907800173", category: "饮料", packageSize: "245ml", servingSize: "1罐 245ml",
      ingredients: "生牛乳、水、白砂糖、全脂乳粉、食品添加剂", allergens: ["乳"], per100g: { energyKcal: 76, protein: 2.3, fat: 3, carbs: 10, sugar: 9.6, sodiumMg: 45 }, perServing: { energyKcal: 186, protein: 5.6, fat: 7.4, carbs: 24.5 } }),
    P({ id: "d-yogurt", name: "原味酸奶", brand: "光明", barcode: "6901209256348", category: "乳制品", packageSize: "200g", servingSize: "1杯 200g", confidence: "high",
      ingredients: "生牛乳、白砂糖、乳酸菌", allergens: ["乳"], per100g: { energyKcal: 92, protein: 2.9, fat: 3.1, carbs: 13.2, sugar: 12, sodiumMg: 60 }, perServing: { energyKcal: 184, protein: 5.8, fat: 6.2, carbs: 26.4 } }),
    P({ id: "d-nuts", name: "每日坚果", brand: "三只松鼠", barcode: "6971284691008", category: "坚果果干", packageSize: "25g×7", servingSize: "1包 25g",
      ingredients: "腰果、扁桃仁、榛子、核桃仁、蔓越莓干、葡萄干", allergens: ["坚果"], per100g: { energyKcal: 560, protein: 15, fat: 42, carbs: 30, sugar: 14 }, perServing: { energyKcal: 140, protein: 3.8, fat: 10.5, carbs: 7.5 } }),
    P({ id: "d-latiao", name: "大面筋辣条", brand: "卫龙", barcode: "6935284499912", category: "膨化食品", packageSize: "102g", servingSize: "半包 51g", confidence: "low",
      ingredients: "小麦粉、大豆油、辣椒、白砂糖、食用盐", allergens: ["小麦", "大豆"], per100g: { energyKcal: 421, protein: 10, fat: 20, carbs: 50, sodiumMg: 1500 }, perServing: { energyKcal: 215 } }),
    P({ id: "d-noodle", name: "红烧牛肉面", brand: "康师傅", barcode: "6900873000025", category: "方便食品", packageSize: "103g", servingSize: "1包 103g",
      ingredients: "小麦粉、棕榈油、牛肉粉、食用盐、香辛料", allergens: ["小麦"], per100g: { energyKcal: 455, protein: 8.9, fat: 20.5, carbs: 59, sodiumMg: 2100 }, perServing: { energyKcal: 469 } }),
    P({ id: "d-dove", name: "丝滑牛奶巧克力", brand: "德芙", barcode: "6914973600010", category: "糖果巧克力", packageSize: "43g", servingSize: "1条 43g",
      ingredients: "白砂糖、可可脂、全脂乳粉、可可液块、乳糖、大豆磷脂", allergens: ["乳", "大豆"], per100g: { energyKcal: 563, protein: 7, fat: 34, carbs: 56, sugar: 52 }, perServing: { energyKcal: 242 } }),
    P({ id: "d-banana", name: "香蕉", category: "水果生鲜", packageSize: "约 1kg", ingredients: "", allergens: [], per100g: { energyKcal: 93 }, perServing: {}, confidence: "low" }),
  ];
  const B = (id: string, productId: string, quantity: number, unit: string, location: string, expiryIn: number | null, boughtAgo = 3, openedAgo?: number): Batch => ({
    id, productId, quantity, unit, location, createdAt: now,
    purchaseDate: addDays(today, -boughtAgo),
    openedDate: openedAgo !== undefined ? addDays(today, -openedAgo) : undefined,
    expiryDate: expiryIn === null ? undefined : addDays(today, expiryIn),
  });
  const batches: Batch[] = [
    B("db-lays", "d-lays", 3, "包", "零食柜", 60),
    B("db-oreo", "d-oreo", 2, "包", "零食柜", 3),
    B("db-wangzai", "d-wangzai", 6, "罐", "厨房橱柜", 120, 10),
    B("db-yog1", "d-yogurt", 2, "杯", "冰箱冷藏", 1, 6),
    B("db-yog2", "d-yogurt", 4, "杯", "冰箱冷藏", 12, 1),
    B("db-nuts", "d-nuts", 5, "包", "办公室", 2, 20, 2),
    B("db-latiao", "d-latiao", 1, "包", "零食柜", -1, 40),
    B("db-noodle", "d-noodle", 4, "包", "厨房橱柜", 150, 15),
    B("db-dove", "d-dove", 3, "条", "零食柜", 7, 30),
    B("db-banana", "d-banana", 5, "根", "厨房橱柜", null, 2),
  ];
  return {
    version: 1,
    products,
    batches,
    cart: [],
    settings: { allergies: [], dailyCalorieGoal: 2000, remindDays: [3, 1], inAppReminders: true },
  };
}
