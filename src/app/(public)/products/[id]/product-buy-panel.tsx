"use client";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { type ProductT, type ProductVariantT } from "@/db/schema";
import { useCart } from "@/app/cart/cart-provider";
import { Check, ShoppingCart } from "lucide-react";

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

function extractVariantPreview(variants?: ProductVariantT[]) {
  if (!variants?.length) return { colors: [] as string[], sizes: [] as string[] };
  const colors = unique(
    variants.map((v) => v.attributes?.color).filter((c): c is string => typeof c === "string" && c.length > 0)
  );
  const sizes = unique(
    variants.map((v) => v.attributes?.size).filter((s): s is string => typeof s === "string" && s.length > 0)
  );
  return { colors, sizes };
}

export default function ProductBuyPanel({ product, variants }: { product: ProductT; variants: ProductVariantT[] }) {
  const { addItem, loading } = useCart();

  const { colors, sizes } = extractVariantPreview(variants);
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (!variants?.length) return null;
    const base = product.price_in_cents;
    const best = [...variants].sort((a, b) => (a.price_in_cents ?? base) - (b.price_in_cents ?? base))[0];
    return best?.id ?? null;
  });
  const matchedVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;
    const byAttr = variants.find(v =>
      (selectedColor ? v.attributes?.color === selectedColor : true) &&
      (selectedSize ? v.attributes?.size === selectedSize : true)
    );
    if (byAttr) return byAttr;
    const byId = variants.find(v => v.id === selectedVariantId);
    return byId ?? variants[0] ?? null;
  }, [variants, selectedColor, selectedSize, selectedVariantId]);

  const priceCents = matchedVariant?.price_in_cents ?? product.price_in_cents;
  const inStock = (matchedVariant?.stock ?? 1) > 0;
  const [qty, setQty] = useState<number>(1);
  const [addedPulse, setAddedPulse] = useState(false);

  async function onAddToCart() {
    const variant_id = matchedVariant?.id ?? selectedVariantId ?? null;
    await addItem({ product_id: product.id, variant_id, quantity: qty });
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 1200);
  }

  return (
    <div className="mt-8 rounded-xl border border-border/60 bg-background/70 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Price</div>
          <div className="mt-1 text-4xl font-extrabold tracking-tight">{formatCents(priceCents)}</div>
        </div>
        <div
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs",
            inStock ? "border-emerald-400/50 text-emerald-500" : "border-rose-400/50 text-rose-500"
          )}
        >
          {inStock ? "In stock" : "Out of stock"}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex items-center overflow-hidden rounded-full border border-border/60 bg-background/80">
          <button
            aria-label="Decrease quantity"
            className="h-10 w-10 text-lg hover:bg-foreground/5 disabled:opacity-60"
            onClick={() => setQty((n) => Math.max(1, n - 1))}
            disabled={loading}
          >
            −
          </button>
          <div className="w-12 text-center text-sm tabular-nums">{qty}</div>
          <button
            aria-label="Increase quantity"
            className="h-10 w-10 text-lg hover:bg-foreground/5 disabled:opacity-60"
            onClick={() => setQty((n) => n + 1)}
            disabled={loading}
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={loading || !inStock}
          className={cn(
            "h-11 rounded-full px-6 text-base font-semibold transition-colors disabled:opacity-60",
            "sm:flex-1",
            addedPulse ? "bg-emerald-500 text-black" : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {addedPulse ? 'Added to cart' : (loading ? 'Adding…' : 'Add to cart')}
        </button>
      </div>

      {(colors.length > 0 || sizes.length > 0) && (
        <div className="mt-6 space-y-5">
          {colors.length > 0 && (
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Color</div>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => setSelectedColor(c)}
                    className={cn("h-7 w-7 rounded-full ring-2 ring-offset-2", selectedColor === c ? "ring-foreground" : "ring-foreground/30")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
          {sizes.length > 0 && (
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Size</div>
              <div className="flex flex-wrap items-center gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      selectedSize === s ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background/60 hover:border-border"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(!colors.length && !sizes.length && variants && variants.length > 0) && (
        <div className="mt-6">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Variant
            <select
              value={selectedVariantId ?? ""}
              onChange={(e) => setSelectedVariantId(e.target.value || null)}
              className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-foreground"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.title ?? v.sku ?? "Variant"}</option>
              ))}
            </select>
          </label>
        </div>
      )}

    </div>
  );
}
