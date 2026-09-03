// CHOCO FOOD APP — LAB catalog seed
// IMPORTANT: LAB ONLY. This file is not connected to production orders/menu tables.
// Later this adapter can be replaced by a Supabase catalog API without changing the UI.

export const catalogMock = {
  version: 1,
  updatedAt: "2026-09-03T00:00:00Z",
  categories: [
    { id: "all", name: "Tất cả", icon: "🍽️" },
    { id: "com", name: "Cơm", icon: "🍚" },
    { id: "bun", name: "Bún", icon: "🍜" },
    { id: "ga", name: "Gà", icon: "🍗" },
    { id: "drink", name: "Đồ uống", icon: "🥤" }
  ],
  restaurants: [
    {
      id: "r1",
      name: "Cơm Nhà Phú Quốc",
      categoryId: "com",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
      isOpen: true,
      foods: [
        { id: "f101", name: "Cơm gà", price: 45000, available: true },
        { id: "f102", name: "Cơm sườn", price: 50000, available: true },
        { id: "f103", name: "Cơm thịt kho", price: 45000, available: true }
      ]
    },
    {
      id: "r2",
      name: "Bún Phú Quốc",
      categoryId: "bun",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80",
      isOpen: true,
      foods: [
        { id: "f201", name: "Bún bò", price: 50000, available: true },
        { id: "f202", name: "Bún thịt nướng", price: 45000, available: true },
        { id: "f203", name: "Bún chả", price: 50000, available: true }
      ]
    },
    {
      id: "r3",
      name: "Gà Rán PQ",
      categoryId: "ga",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80",
      isOpen: true,
      foods: [
        { id: "f301", name: "Gà rán", price: 40000, available: true },
        { id: "f302", name: "Gà sốt cay", price: 45000, available: true },
        { id: "f303", name: "Combo gà", price: 70000, available: true }
      ]
    },
    {
      id: "r4",
      name: "Choco Drinks",
      categoryId: "drink",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80",
      isOpen: true,
      foods: [
        { id: "f401", name: "Trà sữa", price: 30000, available: true },
        { id: "f402", name: "Trà đào", price: 30000, available: true },
        { id: "f403", name: "Matcha", price: 35000, available: true }
      ]
    }
  ]
};

export async function loadCatalog() {
  // LAB V1: local mock. Production Supabase is intentionally NOT queried here.
  return structuredClone(catalogMock);
}
