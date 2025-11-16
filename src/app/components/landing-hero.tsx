"use client";
import { Bebas_Neue, Inter } from "next/font/google";
import { motion } from "framer-motion";
import { ArrowDownRight, ShieldCheck, Truck, Star } from "lucide-react";
import BackgroundImage from "./background-image";

const fontHead = Bebas_Neue({ subsets: ["latin"], weight: "400" });
const fontBody = Inter({ subsets: ["latin"] });

export default function LandingHero() {
  return (
    <main className="system-theme relative min-h-[100svh] overflow-hidden bg-background text-foreground ">
      {/* Background image: wide, subtle, and inverted in dark mode */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-white z-10 dark:from-black dark:via-black/25 dark:to-black"/>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10 dark:from-black dark:via-transparent dark:to-black"/>
      <BackgroundImage src={"/hero-bg.png"}/>
      {/* Content grid: left-focused on desktop, centered on mobile */}
      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-7xl items-center gap-10 px-6 lg:grid-cols-[minmax(0,620px)_1fr]">
        {/* Left column */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="order-2 text-center lg:order-1 lg:text-left"
          style={fontBody.style}
        >
          {/* Kicker */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] tracking-wide text-foreground/70">
            <span className="h-1.5 w-1.5 rounded-full bg-black/60 dark:bg-white/60" />
            Founder’s Batch • Limited Run
            <span className="h-1.5 w-1.5 rounded-full bg-black/60 dark:bg-white/60 block md:hidden" />
          </div>

          {/* Headline — clean, no outline */}
          <h1
            className={`${fontHead.className} leading-[0.9] text-[14vw] sm:text-[12vw] lg:text-[96px] -tracking-[0.01em] w-fit relative justify-self-center lg:justify-self-start`}
          >
            LIFT HEAVY,
            <br />
            LIFT SAFE.
          </h1>

          {/* Subcopy */}
          <p className="mt-4 max-w-[46ch] text-sm text-muted-foreground sm:text-base lg:pr-6 justify-self-center lg:justify-self-start">
            Minimal straps. Maximum control. Built for secure pulls, repeatable setup, and relentless progression.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand-2)/0.6)] focus-visible:ring-offset-background"
            >
              Shop Straps
            </a>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm backdrop-blur bg-background/60 text-foreground/90 border-[hsl(var(--brand-2)/0.35)] hover:bg-background/80 hover:border-[hsl(var(--brand-2)/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-2)/0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Explore Collection <ArrowDownRight className="h-4 w-4" />
            </a>
          </div>

          {/* Trust bar */}
          <div className="mt-6 flex items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground lg:justify-start">
            <span className="inline-flex items-center gap-1 bg-white rounded-full dark:bg-black px-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-1">4.9/5 from 500+ lifters</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-white rounded-full dark:bg-black px-2">
              <Truck className="h-3.5 w-3.5" /> Ships in 24h
            </span>
          </div>
        </motion.section>

        {/* Right column is intentionally empty to keep the strap breathing room */}
        <div className="order-1 hidden lg:block" />
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#products"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Scroll to products
        <span className="inline-block h-2 w-2 -translate-y-0.5 rotate-45 border-b border-r border-foreground/50" />
      </motion.a>
    </main>
  );
}
