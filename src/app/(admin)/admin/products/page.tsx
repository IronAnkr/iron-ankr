"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { type ProductT } from "@/db/schema";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { ProductFormModal } from "@/app/components/admin/products/product-form-modal";

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function AdminProductsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [products, setProducts] = useState<ProductT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductT | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description,status,price_in_cents,images,tags,metadata,created_at,updated_at,deleted_at")
      .is('deleted_at', null)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setProducts((data as ProductT[] | null) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Products</h1>
          <p className="text-sm text-muted-foreground">Manage inventory, pricing, and visibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition">Add Product</button>
        </div>
      </header>

      <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>Overview of products in your store.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Images</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-white/70">Loading…</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-white/70">No products yet. Click “Add Product” to create your first one.</TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.status}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatCents(p.price_in_cents)}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.images?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditing(p); setOpen(true); }}
                          className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90 hover:border-white/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${p.name}? You can’t undo this.`)) return;
                            const { error } = await supabase
                              .from('products')
                              .update({ deleted_at: new Date().toISOString(), status: 'archived' })
                              .eq('id', p.id);
                            if (error) { alert(error.message); return; }
                            void load();
                          }}
                          className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-rose-200 hover:border-rose-400/40"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={() => { setOpen(false); setEditing(null); void load(); }}
        initial={editing}
      />
    </div>
  );
}
