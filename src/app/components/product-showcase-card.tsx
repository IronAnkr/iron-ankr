import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { type ProductT, type ProductVariantT } from "@/db/schema";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/cart/cart-provider";

type Props = {
  product: ProductT;
  variants?: ProductVariantT[];
  className?: string;
  badge?: string;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function getDisplayPrice(product: ProductT, variants?: ProductVariantT[]) {
  const base = product.price_in_cents;
  if (!variants?.length) return { label: formatCents(base), from: false };
  const overridePrices = variants
    .map((v) => v.price_in_cents ?? base)
    .filter((n) => typeof n === "number") as number[];
  const min = Math.min(...overridePrices);
  return min < base
    ? { label: `from ${formatCents(min)}`, from: true }
    : { label: formatCents(min), from: false };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

const colorMap: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  sand: "#c2b280",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  gray: "#6b7280",
};

function extractVariantPreview(variants?: ProductVariantT[]) {
  if (!variants?.length) return { colors: [] as string[], sizes: [] as string[] };
  const colors = unique(
    variants
      .map((v) => v.attributes?.color)
      .filter((c): c is string => typeof c === "string" && c.length > 0)
  );
  const sizes = unique(
    variants
      .map((v) => v.attributes?.size)
      .filter((s): s is string => typeof s === "string" && s.length > 0)
  );
  return { colors, sizes };
}

function getRating(product: ProductT): number | undefined {
  const meta = product.metadata;
  if (meta && "rating" in meta) {
    const val = meta["rating"];
    if (typeof val === "number") return Math.max(0, Math.min(5, val));
  }
  return undefined;
}

export default function ProductShowcaseCard({ product, variants, className, badge }: Props) {
  const [coverSrc, setCoverSrc] = useState<string>(product.images?.[0] ?? "/logo.png");
  const hoverSrc = product.images?.[1] ?? null;
  const { colors, sizes } = extractVariantPreview(variants);
  const rating = getRating(product);
  const { addItem, loading } = useCart();

  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (!variants?.length) return null;
    const base = product.price_in_cents;
    const best = [...variants].sort((a, b) => (a.price_in_cents ?? base) - (b.price_in_cents ?? base))[0];
    return best?.id ?? null;
  });
  const [qty, setQty] = useState<number>(1);
  const [addedPulse, setAddedPulse] = useState(false);

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

  const effectivePrice = useMemo(() => {
    if (matchedVariant?.price_in_cents != null) return matchedVariant.price_in_cents;
    return product.price_in_cents;
  }, [matchedVariant, product.price_in_cents]);

  const price = useMemo(() => getDisplayPrice(product, variants), [product, variants]);
  const inStock = (matchedVariant?.stock ?? 1) > 0;

  async function onAddToCart() {
    const variant_id = matchedVariant?.id ?? selectedVariantId ?? null;
    await addItem({ product_id: product.id, variant_id, quantity: qty });
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 1200);
  }

  return (
    <article className={cn("group text-white", className)}>
      <div className={cn("relative rounded-2xl p-[1px]", "bg-gradient-to-br from-white/15 via-white/5 to-transparent group-hover:from-rose-400/30 group-hover:via-violet-400/20 group-hover:to-emerald-400/20 transition-colors")}
      >
        <div className="relative overflow-hidden rounded-[1rem] border border-white/10 bg-zinc-950/80 backdrop-blur-sm">
          <div className="relative aspect-[4/5] w-full">
            {/* High-contrast, aesthetic background for transparent product images */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundColor: '#8b8b8b',
                backgroundImage: [
                  'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)',
                  'radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.25), rgba(0,0,0,0) 50%)',
                  'conic-gradient(from 210deg at 50% 50%, rgba(14,165,233,0.10), rgba(244,63,94,0.10), rgba(109,40,217,0.08), rgba(14,165,233,0.10))',
                  'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                  'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.22) 100%)',
                  'linear-gradient(180deg, #8b8b8b, #8b8b8b)'
                ].join(', '),
                backgroundSize: 'auto, auto, auto, 28px 28px, 28px 28px, auto, auto',
                backgroundPosition: 'center',
              }}
            />
            <Image
              src={coverSrc}
              alt={product.name}
              fill
              priority={false}
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
              className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
              style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.40)) drop-shadow(0 0 2px rgba(0,0,0,0.85))' }}
              onError={() => { if (coverSrc !== "/logo.png") setCoverSrc("/logo.png"); }}
            />
            

            {(badge || rating !== undefined) && (
              <div className="absolute left-3 top-3 flex items-center gap-2">
                {badge && (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                    {badge}
                  </span>
                )}
                {rating !== undefined && (
                  <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs backdrop-blur">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i + 1 <= Math.round(rating) ? "text-yellow-400" : "text-zinc-600"
                        )}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )}
            {/* Hover image swap */}
            {hoverSrc && (
              <Image
                src={hoverSrc}
                alt={product.name + " alternate"}
                fill
                priority={false}
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-center transition duration-700 ease-out opacity-0 group-hover:opacity-100"
              />
            )}
          </div>

          <div className="relative p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-300 line-clamp-2">
                  {product.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-black inline-block">
                  {matchedVariant ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(effectivePrice / 100) : price.label}
                </div>
                <div className={cn("mt-1 text-xs", (matchedVariant?.stock ?? 1) > 0 ? "text-emerald-300" : "text-rose-300")}>{(matchedVariant?.stock ?? 1) > 0 ? "In stock" : "Out of stock"}</div>
              </div>
            </div>
            {/* Variant selectors */}
            {(colors.length > 0 || sizes.length > 0 || (variants && variants.length > 0)) && (
              <div className="mt-3 space-y-2">
                {colors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Color</span>
                    <div className="flex items-center gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          title={c}
                          onClick={() => setSelectedColor(c)}
                          className={cn("h-5 w-5 rounded-full ring-2", selectedColor === c ? "ring-white" : "ring-white/50")}
                          style={{ backgroundColor: colorMap[c] ?? c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {sizes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Size</span>
                    <div className="flex items-center gap-1">
                      {sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={cn("rounded-md border px-2 py-0.5 text-[11px]", selectedSize === s ? "border-white bg-white/10" : "border-white/20 bg-black/40 hover:border-white/40")}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(!colors.length && !sizes.length && variants && variants.length > 0) && (
                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    Variant
                    <select
                      value={selectedVariantId ?? ""}
                      onChange={(e) => setSelectedVariantId(e.target.value || null)}
                      className="rounded-md border border-white/20 bg-black/60 px-2 py-1 text-xs text-white"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>{v.title ?? v.sku ?? "Variant"}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Decrease quantity"
                  className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/90 hover:border-white/30"
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  disabled={loading}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 rounded-md border border-white/15 bg-black/50 px-2 py-1 text-center text-white/90 text-sm"
                />
                <button
                  aria-label="Increase quantity"
                  className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/90 hover:border-white/30"
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
                className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
                  addedPulse ? "bg-emerald-500 text-black" : "bg-white text-black hover:bg-zinc-200")}
              >
                {addedPulse ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                {addedPulse ? 'Added' : (loading ? 'Adding…' : 'Add to cart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
