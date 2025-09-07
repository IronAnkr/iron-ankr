import { type ProductT, type ProductVariantT } from "@/db/schema";

// Simple helper for ISO timestamps
const now = new Date().toISOString();

// Pre-generated UUIDs to keep relationships stable
const ids = {
  products: {
    classic: "11111111-1111-4111-8111-111111111111",
    figure8: "22222222-2222-4222-8222-222222222222",
  },
  variants: {
    classicBlack: "31111111-1111-4111-8111-111111111111",
    classicSand: "31111111-1111-4111-8111-111111111112",
    figure8Small: "32222222-2222-4222-8222-222222222221",
    figure8Large: "32222222-2222-4222-8222-222222222222",
  },
};

type ProductSeed = ProductT & { variants?: string[] };
export const products: ProductSeed[] = [
  {
    id: ids.products.classic,
    name: "Iron ankr Classic Lifting Straps",
    description:
      "Durable cotton straps for everyday pulling days. Comfortable, secure, and built to last.",
    status: "active",
    price_in_cents: 1999,
    variants: [ids.variants.classicBlack, ids.variants.classicSand],
    images: [
      "/hero-bg.png", // placeholder image from /public
    ],
    tags: [],
    metadata: { category: "straps", material: "cotton" },
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: ids.products.figure8,
    name: "Iron ankr Figure-8 Straps",
    description:
      "Max-security figure-8s for deadlifts and heavy pulls. Lock in and focus on the lift.",
    status: "active",
    price_in_cents: 2499,
    variants: [ids.variants.figure8Small, ids.variants.figure8Large],
    images: [
      "/logo.png", // placeholder image from /public
    ],
    tags: [],
    metadata: { category: "straps", style: "figure-8" },
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

export const variants: ProductVariantT[] = [
  {
    id: ids.variants.classicBlack,
    product_id: ids.products.classic,
    sku: "IA-CLS-STRAP-BLK",
    title: "Black",
    attributes: { color: "black" },
    price_in_cents: 1999,
    stock: 120,
    barcode: "IA-CLS-BLK-0001",
    weight_grams: 150,
    metadata: { finish: "matte" },
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: ids.variants.classicSand,
    product_id: ids.products.classic,
    sku: "IA-CLS-STRAP-SND",
    title: "Sand",
    attributes: { color: "sand" },
    price_in_cents: 1999,
    stock: 80,
    barcode: "IA-CLS-SND-0001",
    weight_grams: 150,
    metadata: { finish: "matte" },
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: ids.variants.figure8Small,
    product_id: ids.products.figure8,
    sku: "IA-F8-STRAP-S",
    title: "Small",
    attributes: { size: "S" },
    price_in_cents: 2499,
    stock: 50,
    barcode: "IA-F8-S-0001",
    weight_grams: 180,
    metadata: { fit: "snug" },
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: ids.variants.figure8Large,
    product_id: ids.products.figure8,
    sku: "IA-F8-STRAP-L",
    title: "Large",
    attributes: { size: "L" },
    price_in_cents: 2599, // slightly higher
    stock: 65,
    barcode: "IA-F8-L-0001",
    weight_grams: 195,
    metadata: { fit: "roomy" },
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

// Convenience: products with their variant objects
export const productsWithVariants = products.map((p) => ({
  product: p,
  variants: variants.filter((v) => v.product_id === p.id),
}));

export type ProductWithVariants = (typeof productsWithVariants)[number];
