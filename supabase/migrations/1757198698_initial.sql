-- Initial schema derived from src/db/schema.ts (Zod)
-- Target: PostgreSQL (Supabase compatible)

-- Extensions
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Enums
do $$ begin
  create type order_status as enum ('pending','processing','paid','shipped','delivered','canceled','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','authorized','paid','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfillment_status as enum ('unfulfilled','partial','fulfilled','shipped','delivered','returned','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percent','amount');
exception when duplicate_object then null; end $$;

do $$ begin
  create type banner_variant as enum ('info','success','warning','error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('active','draft','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('user','admin', 'owner');
exception when duplicate_object then null; end $$;

-- Trigger helper to auto-update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Addresses
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  name text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country_code char(2) not null,
  phone text
);

-- Users (app-level roles)
create table if not exists app_users (
  id uuid primary key,
  email text not null unique,
  role user_role not null default 'user',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger t_app_users_updated
  before update on app_users
  for each row execute procedure set_updated_at();

-- Customers
create table if not exists customers (
  id uuid primary key,
  email text not null unique,
  first_name text,
  last_name text,
  phone text,
  default_shipping_address_id uuid references addresses(id) on delete set null,
  default_billing_address_id uuid references addresses(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger t_customers_updated
  before update on customers
  for each row execute procedure set_updated_at();

-- Products
create table if not exists products (
  id uuid primary key,
  name text not null,
  description text not null default '',
  slug text unique,
  status product_status not null default 'active',
  price_in_cents integer not null check (price_in_cents >= 0),
  images text[] not null default '{}',
  tags text[] not null default '{}',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger t_products_updated
  before update on products
  for each row execute procedure set_updated_at();

-- Product variants
create table if not exists product_variants (
  id uuid primary key,
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  title text,
  attributes jsonb not null default '{}',
  price_in_cents integer check (price_in_cents is null or price_in_cents >= 0),
  stock integer not null default 0 check (stock >= 0),
  barcode text,
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_product_variants_product_id on product_variants(product_id);
create trigger t_product_variants_updated
  before update on product_variants
  for each row execute procedure set_updated_at();

-- Carts
create table if not exists carts (
  id uuid primary key,
  customer_id uuid references customers(id) on delete set null,
  subtotal_in_cents integer not null default 0,
  discount_in_cents integer not null default 0,
  tax_in_cents integer not null default 0,
  shipping_in_cents integer not null default 0,
  total_in_cents integer not null default 0,
  currency char(3) not null default 'USD',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists idx_carts_customer_id on carts(customer_id);
create trigger t_carts_updated before update on carts for each row execute procedure set_updated_at();

-- Cart line items
create table if not exists cart_line_items (
  id uuid primary key,
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid references product_variants(id) on delete set null,
  title text not null,
  sku text,
  quantity integer not null check (quantity >= 1),
  unit_price_in_cents integer not null check (unit_price_in_cents >= 0),
  total_price_in_cents integer not null check (total_price_in_cents >= 0),
  metadata jsonb
);
create index if not exists idx_cart_line_items_cart_id on cart_line_items(cart_id);

-- Orders
create table if not exists orders (
  id uuid primary key,
  cart_id uuid references carts(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  subtotal_in_cents integer not null,
  discount_in_cents integer not null default 0,
  tax_in_cents integer not null default 0,
  shipping_in_cents integer not null default 0,
  total_in_cents integer not null,
  currency char(3) not null default 'USD',
  status order_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  shipping_address_id uuid references addresses(id) on delete set null,
  billing_address_id uuid references addresses(id) on delete set null,
  notes text,
  metadata jsonb,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  canceled_at timestamptz
);
create index if not exists idx_orders_customer_id on orders(customer_id);
create trigger t_orders_updated before update on orders for each row execute procedure set_updated_at();

-- Order line items
create table if not exists order_line_items (
  id uuid primary key,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid references product_variants(id) on delete set null,
  title text not null,
  sku text,
  quantity integer not null check (quantity >= 1),
  unit_price_in_cents integer not null check (unit_price_in_cents >= 0),
  total_price_in_cents integer not null check (total_price_in_cents >= 0),
  metadata jsonb
);
create index if not exists idx_order_line_items_order_id on order_line_items(order_id);

-- Reviews
create table if not exists reviews (
  id uuid primary key,
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  content text not null,
  approved boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_reviews_product_id on reviews(product_id);
create trigger t_reviews_updated before update on reviews for each row execute procedure set_updated_at();

-- Discounts
create table if not exists discounts (
  id uuid primary key,
  code text not null,
  description text,
  type discount_type not null,
  value numeric(10,2) not null check (value >= 0),
  start_date date,
  end_date date,
  max_uses integer check (max_uses is null or max_uses >= 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  product_ids uuid[], -- optional scope
  variant_ids uuid[], -- optional scope
  minimum_subtotal_in_cents integer,
  active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists uniq_discounts_code_lower on discounts (lower(code));
create trigger t_discounts_updated before update on discounts for each row execute procedure set_updated_at();

-- Banner messages
create table if not exists banner_messages (
  id uuid primary key,
  message text not null,
  link_url text,
  variant banner_variant not null default 'info',
  priority integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_banner_messages_active on banner_messages(active);
create trigger t_banner_messages_updated before update on banner_messages for each row execute procedure set_updated_at();

