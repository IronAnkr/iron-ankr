import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cn } from "@/utils/cn";
import { type ProductT, type ProductVariantT } from "@/db/schema";
import ProductBuyPanel from "./product-buy-panel";

function isUUID(v: string): boolean {
  // Simple UUID v4-ish check
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const pid = params.id;
  const col = isUUID(pid) ? "id" : "slug";

  const { data: product, error } = await supabase
    .from("products")
    .select("id,name,description,slug,status,price_in_cents,images,tags,metadata,created_at,updated_at,deleted_at")
    .eq(col, pid)
    .is("deleted_at", null)
    .single<ProductT>();

  if (error || !product) return notFound();

  const { data: variants = [] } = await supabase
    .from("product_variants")
    .select("id,product_id,sku,title,attributes,price_in_cents,stock,barcode,weight_grams,metadata,created_at,updated_at,deleted_at")
    .eq("product_id", product.id);

  const images = (product.images && product.images.length > 0) ? product.images : ["/logo.png"]; 

  return (
    <section
      className={cn(
        "system-theme relative w-full overflow-hidden",
        "bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)]",
        "py-32 text-foreground"
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[hsl(var(--background))] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mb-6 text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground">← Back to products</Link>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="relative overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/80 backdrop-blur-sm">
              <div className="relative aspect-[4/5] w-full">
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
                  src={images[0]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40rem, 100vw"
                  className="object-contain"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.40)) drop-shadow(0 0 2px rgba(0,0,0,0.85))' }}
                />
              </div>
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.slice(1, 5).map((src, i) => (
                  <div key={i} className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border/60 bg-card/80">
                    <Image src={src} alt={`${product.name} ${i+2}`} fill sizes="(min-width: 1024px) 10rem, 25vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:pl-6">
            <div className="mb-2 text-xs tracking-widest text-foreground/70">IRON ANCHOR</div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {product.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              {product.description}
            </p>

            <ProductBuyPanel product={product} variants={(variants as ProductVariantT[]) ?? []} />

            {/* Features / Tags */}
            <div className="mt-10">
              <h2 className="text-sm font-semibold tracking-wide text-foreground/80">DETAILS</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(Array.isArray(product.tags) ? product.tags : []).slice(0,6).map((t) => (
                  <div key={t} className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
