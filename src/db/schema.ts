import z from "zod";

// Common primitives
export const UUID = z.string().uuid();
export const Timestamp = z.string().datetime();
export const ISODate = z.coerce.date();
export const Json = z.record(z.string(), z.unknown());

// Shared/nested schemas
export const MoneyCents = z.number().int().nonnegative();

export const Address = z.object({
  name: z.string().min(1).optional(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country_code: z.string().length(2),
  phone: z.string().optional(),
});

export const OrderStatus = z.enum([
  "pending",
  "processing",
  "paid",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
]);

export const PaymentStatus = z.enum([
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
]);

export const FulfillmentStatus = z.enum([
  "unfulfilled",
  "partial",
  "fulfilled",
  "shipped",
  "delivered",
  "returned",
  "canceled",
]);

// Core entities
export const Product = z.object({
  id: UUID,
  name: z.string().min(1),
  description: z.string().default(""),
  price_in_cents: MoneyCents, // base price; variants can override
  variants: z.array(UUID).default([]),
  images: z.array(z.string().url()).default([]),
  metadata: Json.optional(),

  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp.nullable().optional(),
});

export const ProductVariant = z.object({
  id: UUID,
  product_id: UUID,
  sku: z.string().min(1),
  title: z.string().min(1).optional(),
  attributes: z.record(z.string(), z.string()).default({}), // e.g., color:size
  price_in_cents: MoneyCents.optional(), // overrides product price when set
  stock: z.number().int().min(0).default(0),
  barcode: z.string().optional(),
  weight_grams: z.number().int().min(0).optional(),
  metadata: Json.optional(),

  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp.nullable().optional(),
});

export const LineItem = z.object({
  id: UUID,
  product_id: UUID,
  variant_id: UUID.optional(),
  title: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().min(1),
  unit_price_in_cents: MoneyCents,
  total_price_in_cents: MoneyCents, // quantity * unit
  metadata: Json.optional(),
});

export const Customer = z.object({
  id: UUID,
  email: z.string().email(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  default_shipping_address_id: UUID.optional(),
  default_billing_address_id: UUID.optional(),
  metadata: Json.optional(),

  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp.nullable().optional(),
});

export const Cart = z.object({
  id: UUID,
  customer_id: UUID.optional(),
  items: z.array(LineItem).default([]),
  subtotal_in_cents: MoneyCents.default(0),
  discount_in_cents: MoneyCents.default(0),
  tax_in_cents: MoneyCents.default(0),
  shipping_in_cents: MoneyCents.default(0),
  total_in_cents: MoneyCents.default(0),
  currency: z.string().length(3).default("USD"),
  metadata: Json.optional(),

  created_at: Timestamp,
  updated_at: Timestamp,
  expires_at: Timestamp.optional(),
});

export const Order = z.object({
  id: UUID,
  cart_id: UUID.optional(),
  customer_id: UUID.optional(),
  items: z.array(LineItem),

  subtotal_in_cents: MoneyCents,
  discount_in_cents: MoneyCents.default(0),
  tax_in_cents: MoneyCents.default(0),
  shipping_in_cents: MoneyCents.default(0),
  total_in_cents: MoneyCents,
  currency: z.string().length(3).default("USD"),

  status: OrderStatus.default("pending"),
  payment_status: PaymentStatus.default("pending"),
  fulfillment_status: FulfillmentStatus.default("unfulfilled"),

  shipping_address: Address.optional(),
  billing_address: Address.optional(),
  notes: z.string().optional(),
  metadata: Json.optional(),

  placed_at: Timestamp.optional(),
  created_at: Timestamp,
  updated_at: Timestamp,
  canceled_at: Timestamp.nullable().optional(),
});

export const Review = z.object({
  id: UUID,
  product_id: UUID,
  customer_id: UUID.optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(1),
  approved: z.boolean().default(false),
  metadata: Json.optional(),

  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp.nullable().optional(),
});

export const DiscountType = z.enum(["percentage", "fixed"]);

export const Discount = z.object({
  id: UUID,
  code: z.string().toUpperCase(),
  description: z.string().optional(),
  type: DiscountType,
  amount: z.number().nonnegative(), // percent [0-100] when type=percentage
  starts_at: Timestamp.optional(),
  ends_at: Timestamp.optional(),
  max_uses: z.number().int().min(1).optional(),
  uses_count: z.number().int().min(0).default(0),
  product_ids: z.array(UUID).optional(),
  variant_ids: z.array(UUID).optional(),
  minimum_subtotal_in_cents: MoneyCents.optional(),
  active: z.boolean().default(true),
  metadata: Json.optional(),

  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp.nullable().optional(),
});

export const BannerVariant = z.enum(["info", "success", "warning", "error"]);

export const BannerMessage = z.object({
  id: UUID,
  message: z.string().min(1),
  link_url: z.string().url().optional(),
  variant: BannerVariant.default("info"),
  priority: z.number().int().min(0).default(0),
  starts_at: Timestamp.optional(),
  ends_at: Timestamp.optional(),
  active: z.boolean().default(true),
  metadata: Json.optional(),

  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp.nullable().optional(),
});

// Inferred types (optional, helpful for TS consumers)
export type ProductT = z.infer<typeof Product>;
export type ProductVariantT = z.infer<typeof ProductVariant>;
export type LineItemT = z.infer<typeof LineItem>;
export type CustomerT = z.infer<typeof Customer>;
export type CartT = z.infer<typeof Cart>;
export type OrderT = z.infer<typeof Order>;
export type ReviewT = z.infer<typeof Review>;
export type DiscountT = z.infer<typeof Discount>;
export type BannerMessageT = z.infer<typeof BannerMessage>;
