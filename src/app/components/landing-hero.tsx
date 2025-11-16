"use client";

import { Bebas_Neue, Inter } from "next/font/google";
import { motion } from "framer-motion";
import { ArrowDownRight, ShieldCheck, Truck, Star } from "lucide-react";
import BackgroundImage from "./background-image";

const fontHead = Bebas_Neue({ subsets: ["latin"], weight: "400" });
const fontBody = Inter({ subsets: ["latin"] });

export default function LandingHero() {
  return (
    <main className="system-theme relative min-h-[100svh] overflow-hidden bg-background text-foreground">
      {/* Background image + gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-white z-10 dark:from-black dark:via-black/20 dark:to-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10 dark:from-black dark:via-transparent dark:to-black" />
      <BackgroundImage src={"/hero-bg.png"} />

      {/* Content grid */}
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] tracking-wide text-foreground/70 backdrop-blur-md bg-background/70 dark:bg-background/80">
            <span className="h-1.5 w-1.5 rounded-full bg-black/70 dark:bg-white/70" />
            Founder’s Batch • Limited Run
            <span className="hidden h-1.5 w-1.5 rounded-full bg-black/70 dark:bg-white/70 md:block" />
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-foreground/60 md:inline">
              For lifters who don’t quit
            </span>
          </div>

          {/* Discipline label */}
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-foreground/60">
            HEAVY PULLS • DEADLIFTS • ROWS • STRAPS THAT DON’T LET GO
          </p>

          {/* Headline */}
          <h1
            className={`${fontHead.className} relative w-fit justify-self-center leading-[0.9] text-[14vw] -tracking-[0.01em] sm:text-[12vw] lg:justify-self-start lg:text-[96px]`}
          >
            HOLD THE WEIGHT.
            <br />
            HOLD THE STANDARD.
          </h1>


          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-2)/0.8)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Shop Founder’s Batch
            </a>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--brand-2)/0.4)] bg-background/70 px-7 py-3 text-sm text-foreground/90 backdrop-blur transition hover:bg-background/90 hover:border-[hsl(var(--brand-2)/0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-2)/0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Why these straps?
              <ArrowDownRight className="h-4 w-4" />
            </a>
          </div>

          {/* Trust bar */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground lg:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 border border-foreground/5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-1 whitespace-nowrap">
                4.9/5 from 500+ relentless lifters
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 border border-foreground/5">
              <Truck className="h-3.5 w-3.5" /> Ships in 24h
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 border border-foreground/5">
              <ShieldCheck className="h-3.5 w-3.5" />
              30-day no-excuse guarantee
            </span>
          </div>
        </motion.section>

        {/* Right column left open for product imagery / breathing room */}
        <div className="order-1 hidden lg:block" />
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#products"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Scroll to products
        <span className="inline-block h-2 w-2 -translate-y-0.5 rotate-45 border-b border-r border-foreground/50" />
      </motion.a>
    </main>
  );
}

