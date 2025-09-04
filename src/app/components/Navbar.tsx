"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Menu, ShoppingCart, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.2 });
  const bgOpacity = useTransform(progress, [0, 1], [0.3, 0.75]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-16 backdrop-blur-md bg-black/25">
      <motion.div
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-rose-400 via-fuchsia-400 to-sky-400"
        style={{ scaleX: progress }}
      />

      <motion.div
        className="absolute inset-0 -z-10 backdrop-blur-md border-b"
        style={{
          backgroundColor: "rgba(10,10,10,0.6)",
          borderColor: "rgba(255,255,255,0.08)",
          opacity: bgOpacity,
        }}
      />

      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-white/90 sm:block">IRON ANCHOR</span>
        </Link>

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
            className="group hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur hover:border-white/30 md:flex"
          >
            <Search className="h-4 w-4 text-zinc-300" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300">⌘K</kbd>
          </button>

          <CartButton count={2} />

          <button
            aria-label="Menu"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-white/90 backdrop-blur hover:border-white/30 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden border-b border-white/10 backdrop-blur-md bg-black  md:hidden"
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-200" href="#products" onClick={() => setOpen(false)}>Products</a>
            <Link className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-200" href="/about" onClick={() => setOpen(false)}>About</Link>
            <Link className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-200" href="/faq" onClick={() => setOpen(false)}>FAQ</Link>
            <Link className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-200" href="/contact" onClick={() => setOpen(false)}>Contact</Link>
          </div>
        </div>
      </motion.div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group relative text-sm text-zinc-200 transition-colors hover:text-white">
      {label}
      <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-rose-400 via-fuchsia-400 to-sky-400 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

function CartButton({ count = 0 }: { count?: number }) {
  return (
    <button
      aria-label="Cart"
      className="relative inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white text-black px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-zinc-200"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      <span className="absolute -right-2 -top-2 grid h-5 w-5 place-content-center rounded-full bg-gradient-to-br from-rose-500 to-sky-500 text-[10px] font-bold text-white shadow">{count}</span>
    </button>
  );
}
