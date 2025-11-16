"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import ProductShowcaseCard from "./product-showcase-card";
import { type ProductT, type ProductVariantT } from "@/db/schema";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { ShieldCheck, Gem, Heart, Repeat, Zap, Ruler } from "lucide-react";


type ProductWithVariants = { product: ProductT; variants: ProductVariantT[] };

export default function LandingProductShowcase() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [prodRes, varRes] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,description,slug,status,price_in_cents,images,tags,metadata,created_at,updated_at,deleted_at")
            .is('deleted_at', null)
            .eq('status', 'active')
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("product_variants")
            .select("id,product_id,sku,title,attributes,price_in_cents,stock,barcode,weight_grams,metadata,created_at,updated_at,deleted_at"),
        ]);
        if (prodRes.error) throw prodRes.error;
        if (varRes.error) throw varRes.error;
        const variantsByProduct = new Map<string, ProductVariantT[]>();
        (varRes.data as ProductVariantT[] | null)?.forEach((v) => {
          const arr = variantsByProduct.get(v.product_id) ?? [];
          arr.push(v);
          variantsByProduct.set(v.product_id, arr);
        });
        const cat: ProductWithVariants[] = ((prodRes.data as ProductT[] | null) ?? []).map((p) => ({
          product: p,
          variants: variantsByProduct.get(p.id) ?? [],
        }));
        setItems(cat);
      } catch {
        // Swallow error; UI shows loading/empty states
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  return (
    <section
      id="products"
      className={cn(
        "system-theme relative w-full overflow-hidden",
        "bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)]",
        "py-20 text-foreground"
      )}
    >
      <BackgroundGrid />

      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Why These Straps - value props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Why These Straps</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Designed to lock in your grip, protect your hands, and keep the focus on the lift—not the slip.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FeatureCard
            icon={ShieldCheck}
            title="Secure Under Load"
            body="Friction-forward wrap and low-stretch stability for confident pulls on top sets and volume work."
          />
          <FeatureCard
            icon={Gem}
            title="Built To Last"
            body="Reinforced stress points and abrasion-resistant materials mean they hold up when training gets relentless."
          />
          <FeatureCard
            icon={Heart}
            title="Skin-Saver Comfort"
            body="Smooth contact where it matters to reduce hot spots and tears so you can stay consistent."
          />
          <FeatureCard
            icon={Zap}
            title="Fast Setup"
            body="Tapered ends and a clean wrap for quick on/off between sets—no fiddling when it’s time to lift."
          />
          <FeatureCard
            icon={Ruler}
            title="Dialed Fit"
            body="Length and profile tuned for rows, RDLs, and pulls—secure without bulk getting in the way."
          />
          <FeatureCard
            icon={Repeat}
            title="Train The Target"
            body="Shift the limiting factor off your grip so erectors, lats, and traps can do the work."
          />
        </motion.div>

        {/* Trust blurb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"
        >
          <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
            30‑day no‑excuse guarantee
          </span>
          <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
            Ships fast from the U.S.
          </span>
          <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
            Backed by relentless lifters
          </span>
        </motion.div>

        {/* Divider into product lineup */}
        <div className="mx-auto mt-12 h-px max-w-3xl bg-foreground/10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mt-8 text-center"
        >
          <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Shop the Lineup</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick your profile and get to work.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map(({ product, variants }, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: 0.05 * idx }}
            >
              <ProductShowcaseCard
                product={product}
                variants={variants}
                badge={idx === 0 ? "Bestseller" : undefined}
                href={`/products/${product.slug ?? product.id}`}
              />
            </motion.div>
          ))}
        </motion.div>

        {loading && (
          <div className="mt-8 text-center text-sm text-muted-foreground">Loading products…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">New products are coming soon.</div>
        )}
      </div>
    </section>
  );
}

function BackgroundGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[hsl(var(--background))] via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent" />
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 transition-colors">
      <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-foreground/10 p-2.5">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
