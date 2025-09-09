"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/cart/cart-provider";

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function CartPage() {
  const { items, cart, loading, error, updateQuantity, removeItem, clearCart } = useCart();
  const totalQty = items.reduce((n, it) => n + (it.quantity || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-24">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Your cart</h1>
          <p className="text-sm text-white/70">{totalQty} item{totalQty === 1 ? '' : 's'}</p>
        </div>
        <Link href="/products" className="text-sm text-white/80 hover:underline">Continue shopping</Link>
      </header>

      {error && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      {loading && items.length === 0 ? (
        <div className="text-white/80">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/80">
          Your cart is empty. <Link className="underline" href="/products">Browse products</Link>.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <Image src="/logo.png" alt="product" width={64} height={64} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{it.title}</div>
                  <div className="text-xs text-white/60">{it.sku ?? '—'}</div>
                  <div className="mt-1 text-xs text-white/80">{formatCents(it.unit_price_in_cents)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Decrease quantity"
                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/90 hover:border-white/30"
                    onClick={() => void updateQuantity(it.id, Math.max(1, (it.quantity || 1) - 1))}
                    disabled={loading}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => {
                      const next = parseInt(e.target.value || "1", 10);
                      void updateQuantity(it.id, isNaN(next) ? 1 : Math.max(1, next));
                    }}
                    className="w-14 rounded-md border border-white/15 bg-black/50 px-2 py-1 text-center text-white/90"
                  />
                  <button
                    aria-label="Increase quantity"
                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/90 hover:border-white/30"
                    onClick={() => void updateQuantity(it.id, (it.quantity || 1) + 1)}
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
                <div className="w-24 text-right text-sm font-semibold text-white">
                  {formatCents(it.total_price_in_cents)}
                </div>
                <button
                  aria-label="Remove"
                  onClick={() => void removeItem(it.id)}
                  className="ml-2 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 hover:border-white/30"
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="mt-2 text-xs text-white/60 hover:text-white hover:underline"
              onClick={() => void clearCart()}
              disabled={loading}
            >
              Clear cart
            </button>
          </div>

          <aside className="rounded-xl border border-white/10 bg-white/5 p-4 h-fit">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Subtotal</span>
              <span>{formatCents(cart?.subtotal_in_cents ?? 0)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-white/60">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-white/60">
              <span>Tax</span>
              <span>—</span>
            </div>
            <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between text-sm text-white">
              <span>Total</span>
              <span className="text-base font-semibold">{formatCents(cart?.total_in_cents ?? 0)}</span>
            </div>
            <button
              className="mt-4 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
              disabled={items.length === 0 || loading}
            >
              Checkout
            </button>
            <p className="mt-2 text-xs text-white/60">Checkout is a placeholder for now.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
