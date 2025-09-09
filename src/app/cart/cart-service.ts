"use client";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

// Minimal row shapes from DB (align with supabase table names)
export type CartRow = {
  id: string;
  customer_id: string | null;
  subtotal_in_cents: number;
  discount_in_cents: number;
  tax_in_cents: number;
  shipping_in_cents: number;
  total_in_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type CartLineItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  sku: string | null;
  quantity: number;
  unit_price_in_cents: number;
  total_price_in_cents: number;
  metadata: Record<string, unknown> | null;
};

export type ProductRow = {
  id: string;
  name: string;
  price_in_cents: number;
};

export type ProductVariantRow = {
  id: string;
  product_id: string;
  sku: string;
  title: string | null;
  price_in_cents: number | null;
};

const CART_ID_KEY = "ia_cart_id";

export function getStoredCartId(): string | null {
  try {
    return localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredCartId(id: string) {
  try {
    localStorage.setItem(CART_ID_KEY, id);
  } catch {}
}

export function clearStoredCartId() {
  try {
    localStorage.removeItem(CART_ID_KEY);
  } catch {}
}

export async function ensureCart(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  let id = getStoredCartId();
  if (id) {
    // Verify it exists; if it was cleared server-side, create new
    const { data, error } = await supabase
      .from("carts")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!error && data?.id) return id;
  }
  id = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: insertErr } = await supabase.from("carts").insert({
    id,
    currency: "USD",
    subtotal_in_cents: 0,
    discount_in_cents: 0,
    tax_in_cents: 0,
    shipping_in_cents: 0,
    total_in_cents: 0,
    expires_at: expires,
  });
  if (insertErr) throw insertErr;
  setStoredCartId(id);
  return id;
}

export async function fetchCart(cartId: string): Promise<{
  cart: CartRow | null;
  items: CartLineItemRow[];
}> {
  const supabase = getSupabaseBrowserClient();
  const [cartRes, itemsRes] = await Promise.all([
    supabase.from("carts").select("*").eq("id", cartId).maybeSingle(),
    supabase.from("cart_line_items").select("*").eq("cart_id", cartId).order("title", { ascending: true }),
  ]);
  if (cartRes.error) throw cartRes.error;
  if (itemsRes.error) throw itemsRes.error;
  return { cart: (cartRes.data as CartRow | null) ?? null, items: (itemsRes.data as CartLineItemRow[]) ?? [] };
}

async function lookupPricing(product_id: string, variant_id?: string | null): Promise<{
  unit: number;
  title: string;
  sku: string | null;
}> {
  const supabase = getSupabaseBrowserClient();
  const prodRes = await supabase
    .from("products")
    .select("id,name,price_in_cents")
    .eq("id", product_id)
    .maybeSingle();
  if (prodRes.error || !prodRes.data) throw prodRes.error ?? new Error("Product not found");
  const product = prodRes.data as ProductRow & { name: string };
  if (!variant_id) {
    return { unit: product.price_in_cents, title: product.name, sku: null };
  }
  const varRes = await supabase
    .from("product_variants")
    .select("id,product_id,sku,title,price_in_cents")
    .eq("id", variant_id)
    .maybeSingle();
  if (varRes.error || !varRes.data) throw varRes.error ?? new Error("Variant not found");
  const variant = varRes.data as ProductVariantRow;
  const unit = variant.price_in_cents ?? product.price_in_cents;
  const title = variant.title ? `${product.name} — ${variant.title}` : product.name;
  const sku = variant.sku ?? null;
  return { unit, title, sku };
}

export async function recalcCartTotals(cartId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("cart_line_items")
    .select("total_price_in_cents")
    .eq("cart_id", cartId);
  if (error) throw error;
  const subtotal = (data ?? []).reduce((sum, row) => sum + (row.total_price_in_cents ?? 0), 0);
  const discount = 0;
  const tax = 0;
  const shipping = 0;
  const total = subtotal - discount + tax + shipping;
  const { error: updErr } = await supabase
    .from("carts")
    .update({
      subtotal_in_cents: subtotal,
      discount_in_cents: discount,
      tax_in_cents: tax,
      shipping_in_cents: shipping,
      total_in_cents: total,
    })
    .eq("id", cartId);
  if (updErr) throw updErr;
}

export async function addItemToCart(params: {
  cartId?: string;
  product_id: string;
  variant_id?: string | null;
  quantity?: number;
  metadata?: Record<string, unknown>;
}): Promise<{ cart: CartRow | null; items: CartLineItemRow[] }>
{
  const supabase = getSupabaseBrowserClient();
  const cartId = params.cartId ?? (await ensureCart());
  const qty = Math.max(1, Math.floor(params.quantity ?? 1));
  // See if an identical line already exists
  const existing = await supabase
    .from("cart_line_items")
    .select("id,quantity,unit_price_in_cents")
    .eq("cart_id", cartId)
    .eq("product_id", params.product_id)
    .is("variant_id", params.variant_id ?? null)
    .maybeSingle();

  const pricing = await lookupPricing(params.product_id, params.variant_id ?? null);
  if (existing.data && !existing.error) {
    const newQty = existing.data.quantity + qty;
    const newTotal = newQty * existing.data.unit_price_in_cents;
    const { error: upErr } = await supabase
      .from("cart_line_items")
      .update({ quantity: newQty, total_price_in_cents: newTotal })
      .eq("id", existing.data.id);
    if (upErr) throw upErr;
  } else {
    const id = crypto.randomUUID();
    const unit = pricing.unit;
    const total = unit * qty;
    const { error: insErr } = await supabase.from("cart_line_items").insert({
      id,
      cart_id: cartId,
      product_id: params.product_id,
      variant_id: params.variant_id ?? null,
      title: pricing.title,
      sku: pricing.sku,
      quantity: qty,
      unit_price_in_cents: unit,
      total_price_in_cents: total,
      metadata: params.metadata ?? null,
    });
    if (insErr) throw insErr;
  }
  await recalcCartTotals(cartId);
  return fetchCart(cartId);
}

export async function updateItemQuantity(params: { line_item_id: string; quantity: number; }): Promise<{ cart: CartRow | null; items: CartLineItemRow[] }>
{
  const supabase = getSupabaseBrowserClient();
  const qty = Math.max(1, Math.floor(params.quantity));
  // Load unit price to recompute total
  const { data: li, error } = await supabase
    .from("cart_line_items")
    .select("cart_id,unit_price_in_cents")
    .eq("id", params.line_item_id)
    .maybeSingle();
  if (error || !li) throw error ?? new Error("Line item not found");
  const newTotal = qty * li.unit_price_in_cents;
  const { error: updErr } = await supabase
    .from("cart_line_items")
    .update({ quantity: qty, total_price_in_cents: newTotal })
    .eq("id", params.line_item_id);
  if (updErr) throw updErr;
  await recalcCartTotals(li.cart_id);
  return fetchCart(li.cart_id);
}

export async function removeItem(params: { line_item_id: string }): Promise<{ cart: CartRow | null; items: CartLineItemRow[] }>
{
  const supabase = getSupabaseBrowserClient();
  const { data: li, error } = await supabase
    .from("cart_line_items")
    .select("cart_id")
    .eq("id", params.line_item_id)
    .maybeSingle();
  if (error || !li) throw error ?? new Error("Line item not found");
  const { error: delErr } = await supabase
    .from("cart_line_items")
    .delete()
    .eq("id", params.line_item_id);
  if (delErr) throw delErr;
  await recalcCartTotals(li.cart_id);
  return fetchCart(li.cart_id);
}

export async function clearCart(cartId: string): Promise<{ cart: CartRow | null; items: CartLineItemRow[] }>
{
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("cart_line_items")
    .delete()
    .eq("cart_id", cartId);
  if (error) throw error;
  await recalcCartTotals(cartId);
  return fetchCart(cartId);
}

