"use client";

import BackgroundImage from "./background-image";
import GradientOverlay from "./gradient-overlay";
import { Roboto_Slab } from "next/font/google";
import { motion } from "framer-motion";
import { ArrowDownRight, ShieldCheck, Truck, Award, Clock, Star } from "lucide-react";
import Image from "next/image";

const font_b = Roboto_Slab({ subsets: ['latin'], weight: "300"})

export default function LandingHero() {
  return (
    <main className="relative h-[100svh] overflow-hidden">
      {/* Backgrounds */}
      <GradientOverlay />
      <BackgroundImage src="/hero-bg.png"/>
      <DecorativeLayers />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-white text-center md:-mt-8 lg:-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl"
        >
            <Image src="/logo.png" alt="Iron ankr" width={200} height={200} className="justify-self-center" />

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-balance text-5xl font-extrabold leading-[1.05] sm:text-7xl md:text-8xl"
          >
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              LIFT HEAVY,
            </span>
            <br />
            <span className="bg-gradient-to-r from-rose-400 via-fuchsia-300 to-sky-400 bg-clip-text text-transparent drop-shadow">
              LIFT SAFE.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base"
            style={font_b.style}
          >
            The only gym straps you’ll need—engineered for secure pulls, consistent technique, and progressive overload.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow transition-colors hover:bg-zinc-200"
            >
              Shop Now
            </a>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm text-zinc-200 backdrop-blur hover:border-white/30"
            >
              Explore Products <ArrowDownRight className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Social proof / trust bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-300"
          >
            <span className="inline-flex items-center gap-1">
              {[0,1,2,3,4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-1">Rated 4.9/5 by 500+ lifters</span>
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> 30‑day guarantee</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Ships in 24h</span>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.a
          href="#products"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-6 inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-white"
        >
          Scroll to products
          <span className="inline-block h-2 w-2 rotate-45 border-b border-r -translate-y-0.5" />
        </motion.a>

        {/* Floating feature cards */}
        <FloatingFeatureCards />
      </div>
    </main>
  );
}

function DecorativeLayers() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />
      {/* Radials */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
      {/* Glare */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-transparent to-transparent" />
    </div>
  );
}

function FloatingFeatureCards() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        className="pointer-events-none absolute left-4 top-24 hidden max-w-[220px] rounded-xl border border-white/15 bg-white/5 p-3 text-left text-xs text-white/90 backdrop-blur-md sm:block md:left-10"
      >
        <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
          <Award className="h-3.5 w-3.5" /> Pro‑grade build
        </div>
        
        Triple‑stitched nylon, contoured loop, and abrasion‑resistant weave for secure, repeatable pulls.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.55 }}
        className="pointer-events-none absolute right-4 bottom-24 hidden max-w-[240px] rounded-xl border border-white/15 bg-white/5 p-3 text-left text-xs text-white/90 backdrop-blur-md sm:block md:right-10"
      >
        <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-sky-400/30 bg-sky-400/15 px-2 py-0.5 text-sky-200">
          <Clock className="h-3.5 w-3.5" /> Fast setup
        </div>
        
        Wrap once and lift—indexed loop holds position so you can focus on the pull, not the grip.
      </motion.div>
    </>
  );
}
