"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { cn } from "@/utils/cn";
import ProductShowcaseCard from "@/app/components/product-showcase-card";
import { type ProductT, type ProductVariantT } from "@/db/schema";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type ProductWithVariants = { product: ProductT; variants: ProductVariantT[] };

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "price_asc" | "price_desc">("name");
  const [catalog, setCatalog] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    (async () => {
      setLoading(true);
      try {
        const [prodRes, varRes] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,description,status,price_in_cents,images,tags,metadata,created_at,updated_at,deleted_at")
            .is('deleted_at', null)
            .order("created_at", { ascending: false }),
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
        setCatalog(cat);
      } catch {
        // Swallow error; UI shows loading/empty states
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog.filter(({ product }) => {
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q)
      );
    });

    const priceOf = (p: ProductWithVariants) => {
      const base = p.product.price_in_cents;
      const vs = p.variants?.length ? p.variants : undefined;
      const min = vs?.length ? Math.min(...vs.map((v) => v.price_in_cents ?? base)) : base;
      return min;
    };

    return list.sort((a, b) => {
      if (sort === "name") return a.product.name.localeCompare(b.product.name);
      const pa = priceOf(a);
      const pb = priceOf(b);
      return sort === "price_asc" ? pa - pb : pb - pa;
    });
  }, [query, sort, catalog]);

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)] py-20 text-white"
      )}
    >
      <BackgroundGrid />

      <div className="mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Products</h1>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
            Secure, durable straps designed for serious pulling days.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-400 backdrop-blur focus:border-white/30 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <SortButton
              active={sort === "name"}
              onClick={() => setSort("name")}
              label="Name"
            />
            <SortButton
              active={sort === "price_asc"}
              onClick={() => setSort("price_asc")}
              label="Price"
              icon="asc"
            />
            <SortButton
              active={sort === "price_desc"}
              onClick={() => setSort("price_desc")}
              label="Price"
              icon="desc"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {results.map(({ product, variants }, idx) => (
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
          <div className="mt-16 text-center text-sm text-zinc-300">Loading products…</div>
        )}
        {!loading && catalog.length === 0 && (
          <div className="mt-16 text-center text-sm text-zinc-300">No products available yet. Please check back soon.</div>
        )}
        {!loading && catalog.length > 0 && results.length === 0 && (
          <div className="mt-16 text-center text-sm text-zinc-300">No products match your search.</div>
        )}
      </div>
    </section>
  );
}

function SortButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: "asc" | "desc" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs backdrop-blur",
        active ? "border-white/40 bg-white/20 text-white" : "border-white/15 bg-white/5 text-zinc-200 hover:border-white/30"
      )}
    >
      {label}
      {icon === "asc" && <SortAsc className="h-3.5 w-3.5" />}
      {icon === "desc" && <SortDesc className="h-3.5 w-3.5" />}
    </button>
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
