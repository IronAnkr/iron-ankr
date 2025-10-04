"use client";

import { useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Menu, ShoppingCart, Search } from "lucide-react";
import Link from "next/link";
import { PublicBanner } from "./public-banner";
import { UserDropdown } from "./auth/user-dropdown";
import { MobileDrawer } from "./MobileDrawer";
import { useEffect } from "react";
import { SearchModal } from "./search-modal";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.2 });
  const bgOpacity = useTransform(progress, [0, 1], [0.3, 0.75]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
    <nav className="system-theme fixed inset-x-4 top-4 z-50 h-16 rounded-md overflow-visible text-foreground">
      <Image src="/cotton-webbing.png" className="object-cover -z-10 invert rounded-t-md" alt="nav bg" fill/>
      <motion.div
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-rose-400 z-10 via-fuchsia-400 to-sky-400"
        style={{ scaleX: progress }}
      />

      <motion.div
        className="absolute inset-0 -z-10 backdrop-blur-md border-b"
        style={{
          backgroundColor: "hsl(var(--background) / 0.6)",
          borderColor: "hsl(var(--border))",
          opacity: bgOpacity,
        }}
      />

      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4">
        {/* Left: Brand */}
        <LogoIcon />
        {/* Center: Links */}
        <div className="hidden items-center gap-6 md:flex">
          <NavLink href="/products" label="Products" />
          <NavLink href="/about" label="About" />
          <NavLink href="/faq" label="FAQ" />
          <NavLink href="/contact" label="Contact" />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="group hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs backdrop-blur md:flex border-border/60 bg-background/50 text-foreground/80 hover:border-border"
          >
            <Search className="h-4 w-4 text-foreground/80" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-1 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground/80">⌘K</kbd>
          </button>

          <CartButton />

          {/* Auth dropdown */}
          <UserDropdown />

          <button
            aria-label="Menu"
            className="inline-flex items-center justify-center rounded-full border p-2 backdrop-blur md:hidden border-border/60 bg-background/50 text-foreground/90 hover:border-border"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer open={open} setOpen={setOpen} />

      {/* Slim banner, hanging off the bottom edge */}
      <div className="absolute inset-x-0 top-full backdrop-blur-md z-50 rounded-b-lg overflow-hidden ">
        <PublicBanner />
      </div>
    </nav>
    <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group relative text-sm text-foreground/80 transition-colors hover:text-foreground">
      {label}
      <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-rose-400 via-fuchsia-400 to-sky-400 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

import { useCart } from "@/app/cart/cart-provider";
import React from "react";
import LogoIcon from "./logo-icon";
import Image from "next/image";

function CartButton() {
  const { items } = useCart();
  const count = items.reduce((n, it) => n + (it.quantity || 0), 0);
  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors border-border/60 bg-foreground text-background hover:bg-foreground/90"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      <span className="absolute -right-2 -top-2 grid h-5 w-5 place-content-center rounded-full bg-gradient-to-br from-rose-500 to-sky-500 text-[10px] font-bold text-white shadow">{count}</span>
    </Link>
  );
}
