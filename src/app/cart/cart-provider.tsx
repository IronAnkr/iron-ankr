"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type CartRow,
  type CartLineItemRow,
  ensureCart,
  fetchCart,
  addItemToCart,
  updateItemQuantity,
  removeItem,
  clearCart as clearCartItems,
  getStoredCartId,
} from "./cart-service";

type CartState = {
  cartId: string | null;
  cart: CartRow | null;
  items: CartLineItemRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (opts: { product_id: string; variant_id?: string | null; quantity?: number }) => Promise<void>;
  removeItem: (line_item_id: string) => Promise<void>;
  updateQuantity: (line_item_id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const Ctx = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartRow | null>(null);
  const [items, setItems] = useState<CartLineItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const id = cartId ?? getStoredCartId();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCart(id);
      setCart(res.cart);
      setItems(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  useEffect(() => {
    // Ensure a cart exists on first mount
    (async () => {
      setLoading(true);
      try {
        const id = await ensureCart();
        setCartId(id);
        const res = await fetchCart(id);
        setCart(res.cart);
        setItems(res.items);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to init cart");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addItem = useCallback(async (opts: { product_id: string; variant_id?: string | null; quantity?: number }) => {
    if (!cartId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await addItemToCart({ cartId, ...opts });
      setCart(res.cart);
      setItems(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add item");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  const remove = useCallback(async (line_item_id: string) => {
    if (!cartId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await removeItem({ line_item_id });
      setCart(res.cart);
      setItems(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove item");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  const updateQty = useCallback(async (line_item_id: string, quantity: number) => {
    if (!cartId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await updateItemQuantity({ line_item_id, quantity });
      setCart(res.cart);
      setItems(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  const clear = useCallback(async () => {
    if (!cartId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await clearCartItems(cartId);
      setCart(res.cart);
      setItems(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  const value = useMemo<CartState>(() => ({
    cartId,
    cart,
    items,
    loading,
    error,
    refresh,
    addItem,
    removeItem: remove,
    updateQuantity: updateQty,
    clearCart: clear,
  }), [cartId, cart, items, loading, error, refresh, addItem, remove, updateQty, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

