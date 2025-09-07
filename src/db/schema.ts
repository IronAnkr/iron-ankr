import z from "zod";

// Common primitives
export const UUID = z.string().uuid();
export const Timestamp = z.string().datetime();
export const Slug = z
  .string()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");
export const ISODate = z.coerce.date();
export const Json = z.record(z.string(), z.unknown());

// Shared/nested schemas
export const MoneyCents = z.number().int().nonnegative();

export const Address = z.object({
  id: UUID.optional(), // Added since addresses can exist independently
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
export const ProductStatus = z.enum(["active", "draft", "archived"]);

export const Product = z.object({
  id: UUID,
  name: z.string().min(1),
  description: z.string().default(""),
  slug: Slug.optional(),
  status: ProductStatus.default("active"),
  price_in_cents: MoneyCents,
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string().min(1)).default([]),
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
  attributes: z.record(z.string(), z.string()).default({}),
  price_in_cents: MoneyCents.optional(),
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
  total_price_in_cents: MoneyCents,
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
  items: z.array(LineItem).default([]), // Note: items are in cart_line_items table
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
  items: z.array(LineItem), // Note: items are in order_line_items table
  subtotal_in_cents: MoneyCents,
  discount_in_cents: MoneyCents.default(0),
  tax_in_cents: MoneyCents.default(0),
  shipping_in_cents: MoneyCents.default(0),
  total_in_cents: MoneyCents,
  currency: z.string().length(3).default("USD"),
  status: OrderStatus.default("pending"),
  payment_status: PaymentStatus.default("pending"),
  fulfillment_status: FulfillmentStatus.default("unfulfilled"),
  shipping_address: Address.optional(), // Note: stored via shipping_address_id
  billing_address: Address.optional(), // Note: stored via billing_address_id
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

export const DiscountType = z.enum(["percent", "amount"]);

export const Discount = z.object({
  id: UUID,
  code: z.string().toUpperCase(),
  description: z.string().optional(),
  type: DiscountType,
  value: z.number().nonnegative(),
  start_date: ISODate.optional(),
  end_date: ISODate.optional(),
  max_uses: z.number().int().min(0).optional(),
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

// Auth & Teams
export const UserRole = z.enum(["user", "admin", "owner"]);

export const AppUser = z.object({
  id: UUID,
  email: z.string().email(),
  role: UserRole.default("user"),
  metadata: Json.optional(),
  created_at: Timestamp,
  updated_at: Timestamp,
});

export const TeamRole = z.enum(["owner", "admin", "marketing", "member"]);

export const Team = z.object({
  id: UUID,
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  created_at: Timestamp,
  updated_at: Timestamp,
});

export const TeamMember = z.object({
  team_id: UUID,
  user_id: UUID,
  role: TeamRole.default("member"),
  invited_at: Timestamp.optional(),
  joined_at: Timestamp.optional(),
  added_at: Timestamp.optional(),
});

export const TeamInvite = z.object({
  id: UUID,
  team_id: UUID,
  email: z.string().email(),
  role: TeamRole,
  token: z.string(),
  expires_at: Timestamp,
  created_at: Timestamp,
  accepted_at: Timestamp.optional(),
});

// Marketing & Content
export const MarketingCampaignStatus = z.enum(["draft", "live", "paused", "done"]);
export const MarketingCampaignChannel = z.enum(["email", "sms", "organic", "influencer", "ads"]);

export const MarketingCampaign = z.object({
  id: UUID,
  name: z.string().min(1),
  channel: MarketingCampaignChannel,
  budget_cents: MoneyCents.optional(),
  starts_at: Timestamp.optional(),
  ends_at: Timestamp.optional(),
  status: MarketingCampaignStatus.default("draft"),
  created_by: UUID.optional(),
  created_at: Timestamp,
});

export const MarketingLink = z.object({
  id: UUID,
  slug: z.string().min(1),
  destination: z.string().url(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  owned_by: UUID.optional(),
  created_at: Timestamp,
  clicks: z.number().int().default(0),
});

export const LinkClickEvent = z.object({
  id: z.bigint(),
  link_id: UUID,
  ts: Timestamp,
  ip: z.string().optional(),
  ua: z.string().optional(),
  referrer: z.string().optional(),
});

export const ContentPlatform = z.enum(['site','blog','ig','tiktok','yt','email','x','fb','pin','reddit']);
export const ContentStatus = z.enum(['planned','draft','scheduled','published','failed']);

export const ContentPost = z.object({
  id: UUID,
  title: z.string().min(1),
  platform: ContentPlatform,
  status: ContentStatus.default("planned"),
  publish_at: Timestamp.optional(),
  url: z.string().url().optional(),
  campaign_id: UUID.optional(),
  owner: UUID.optional(),
  created_at: Timestamp,
});

export const Affiliate = z.object({
  id: UUID,
  name: z.string().min(1),
  contact: z.string().optional(),
  default_commission_bp: z.number().int().default(1000),
  coupon_code: z.string().optional(),
  link_id: UUID.optional(),
  created_at: Timestamp,
  active: z.boolean().default(true),
});

// Auditing & Ledger
export const ProductAudit = z.object({
  id: z.bigint(),
  product_id: UUID,
  actor: UUID,
  action: z.string(),
  before: Json.optional(),
  after: Json.optional(),
  created_at: Timestamp,
});

export const InventoryLedger = z.object({
  id: z.bigint(),
  sku: z.string(),
  delta: z.number().int(),
  reason: z.string(),
  order_id: UUID.optional(),
  actor: UUID.optional(),
  created_at: Timestamp,
});


// Inferred types
export type ProductT = z.infer<typeof Product>;
export type ProductVariantT = z.infer<typeof ProductVariant>;
export type LineItemT = z.infer<typeof LineItem>;
export type CustomerT = z.infer<typeof Customer>;
export type CartT = z.infer<typeof Cart>;
export type OrderT = z.infer<typeof Order>;
export type ReviewT = z.infer<typeof Review>;
export type DiscountT = z.infer<typeof Discount>;
export type BannerMessageT = z.infer<typeof BannerMessage>;
export type AppUserT = z.infer<typeof AppUser>;
export type TeamT = z.infer<typeof Team>;
export type TeamMemberT = z.infer<typeof TeamMember>;
export type TeamInviteT = z.infer<typeof TeamInvite>;
export type MarketingCampaignT = z.infer<typeof MarketingCampaign>;
export type MarketingLinkT = z.infer<typeof MarketingLink>;
export type LinkClickEventT = z.infer<typeof LinkClickEvent>;
export type ContentPostT = z.infer<typeof ContentPost>;
export type AffiliateT = z.infer<typeof Affiliate>;
export type ProductAuditT = z.infer<typeof ProductAudit>;
export type InventoryLedgerT = z.infer<typeof InventoryLedger>;
