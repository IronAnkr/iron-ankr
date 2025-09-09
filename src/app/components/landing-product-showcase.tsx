"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import ProductShowcaseCard from "./product-showcase-card";
import { type ProductT, type ProductVariantT } from "@/db/schema";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";


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
            .select("id,name,description,status,price_in_cents,images,tags,metadata,created_at,updated_at,deleted_at")
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
        "relative w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)] py-20 text-white"
      )}
    >
      <BackgroundGrid />

      <div className="mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Our Straps</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
            Built for serious pulling: secure, durable, and engineered for repeatable performance.
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
              />
            </motion.div>
          ))}
        </motion.div>

        {loading && (
          <div className="mt-8 text-center text-sm text-zinc-300">Loading products…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="mt-8 text-center text-sm text-zinc-300">New products are coming soon.</div>
        )}
      </div>
    </section>
  );
}

function BackgroundGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-transparent to-transparent" />
    </div>
  );
}
