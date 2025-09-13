"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import {
  ShieldCheck,
  Dumbbell,
  Activity,
  Sparkles,
  Beaker,
  Wrench,
  Gauge,
  ArrowRight,
} from "lucide-react";

export default function AboutPage() {
  return (
    <section
      className={cn(
        "system-theme relative w-full overflow-hidden",
        "bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)]",
        "py-20 text-foreground"
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
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">About Iron ankr</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Built by lifters for lifters. We design gear that amplifies stimulus, manages fatigue, and keeps you lifting safely.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Pillar icon={ShieldCheck} title="Safety First" body="Secure interface, stable mechanics, repeatable technique under load." />
          <Pillar icon={Dumbbell} title="Performance" body="Engineered to unlock effective reps for your prime movers." />
          <Pillar icon={Activity} title="Durability" body="Materials and stitching choices optimized for heavy training cycles." />
          <Pillar icon={Sparkles} title="Simplicity" body="Minimal, purpose-built designs without distractions or gimmicks." />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-14 rounded-2xl border border-border/60 bg-gradient-to-br from-[hsl(var(--foreground)/0.06)] to-[hsl(var(--foreground)/0.02)] p-6"
        >
          <h2 className="text-xl font-bold">How We Build</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Step
              icon={Beaker}
              title="Research"
              body="We analyze biomechanics and training outcomes to define load paths, grip interfaces, and failure modes."
            />
            <Step
              icon={Wrench}
              title="Prototyping"
              body="Rapid iteration on materials, stitching, and ergonomics; we test for comfort, stability, and wear."
            />
            <Step
              icon={Gauge}
              title="Field Testing"
              body="Feedback from lifters across rep ranges informs refinements for reliability and performance."
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 grid gap-6 lg:grid-cols-2"
        >
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <h3 className="text-lg font-semibold">Materials & Craft</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Comfort-first strap widths with reinforced load-bearing seams.</li>
              <li>Friction-optimized weaves for a stable bar interface.</li>
              <li>Finish choices that balance grip, feel, and longevity.</li>
              <li>Quality control on stitch density and wear points.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <h3 className="text-lg font-semibold">Training Philosophy</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Prioritize proximity to failure in target musculature when the goal is hypertrophy.</li>
              <li>Manage fatigue by separating grip development from back-day overload when appropriate.</li>
              <li>Value technique consistency and safe joint stacking across intensities.</li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-12 flex items-center justify-center"
        >
          <a
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow transition-colors hover:bg-foreground/90"
          >
            Explore Products <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Pillar({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 transition-transform hover:-translate-y-1">
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-rose-400/10 blur-3xl transition-opacity group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-foreground/10 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Step({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-4">
      <div className="rounded-lg bg-foreground/10 p-2">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}

function BackgroundGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[hsl(var(--background))] via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent" />
    </div>
  );
}
