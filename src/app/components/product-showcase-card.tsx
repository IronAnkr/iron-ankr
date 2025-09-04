import Image from "next/image";
import { cn } from "@/utils/cn";
import { type ProductT, type ProductVariantT } from "@/db/schema";
import { ShoppingCart } from "lucide-react";

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
  const val = (product.metadata as any)?.rating;
  if (typeof val === "number") return Math.max(0, Math.min(5, val));
  return undefined;
}

export default function ProductShowcaseCard({ product, variants, className, badge }: Props) {
  const price = getDisplayPrice(product, variants);
  const cover = product.images?.[0] ?? "/logo.png";
  const { colors, sizes } = extractVariantPreview(variants);
  const rating = getRating(product);

  return (
    <article className={cn("group text-white", className)}>
      <div className={cn("relative rounded-2xl p-[1px]", "bg-gradient-to-br from-white/15 via-white/5 to-transparent group-hover:from-rose-400/30 group-hover:via-violet-400/20 group-hover:to-emerald-400/20 transition-colors")}
      >
        <div className="relative overflow-hidden rounded-[1rem] border border-white/10 bg-zinc-950/80 backdrop-blur-sm">
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={cover}
              alt={product.name}
              fill
              priority={false}
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-[1deg]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />

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

            {(colors.length > 0 || sizes.length > 0) && (
              <div className="absolute bottom-24 left-4 right-4 flex items-center justify-between">
                {colors.length > 0 && (
                  <div className="flex items-center gap-2">
                    {colors.slice(0, 5).map((c) => (
                      <span
                        key={c}
                        title={c}
                        className="block h-5 w-5 rounded-full ring-2 ring-white/60"
                        style={{ backgroundColor: colorMap[c] ?? c }}
                      />
                    ))}
                    {colors.length > 5 && (
                      <span className="text-xs text-zinc-300">+{colors.length - 5}</span>
                    )}
                  </div>
                )}
                {sizes.length > 0 && (
                  <div className="flex items-center gap-1">
                    {sizes.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] tracking-wide backdrop-blur"
                      >
                        {s}
                      </span>
                    ))}
                    {sizes.length > 4 && (
                      <span className="text-xs text-zinc-300">+{sizes.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
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
              <span className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-black">
                {price.label}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </button>
              <button
                type="button"
                className="text-sm text-zinc-300 underline-offset-4 hover:text-white hover:underline"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
