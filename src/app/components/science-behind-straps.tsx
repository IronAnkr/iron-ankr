"use client";

import { motion } from "framer-motion";
import { Activity, Beaker, Brain, Dumbbell, Flame, ShieldCheck, TimerReset } from "lucide-react";
import { cn } from "@/utils/cn";
import BackgroundImage from "./background-image";
import GradientOverlay from "./gradient-overlay";

export default function ScienceBehindStraps() {
  return (
    <section className={cn(
      "relative w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
      "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)]",
      "py-20 text-white"
    )}>
      <BackgroundGrid />
        <GradientOverlay />
      <BackgroundImage src="/science-behind-straps-bg.png" />

      <div className="mx-auto w-full max-w-6xl px-4 z-10 relative">
        <Header />
        <StatsRow />
        <WhyUseStraps />
        <WhoTheyHelp />
        <WhatTheyImprove />
        <MechanicsExplainer />
        <Citations />
        <CTA />
      </div>
    </section>
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

function Header() {
  return (
    <div className="relative text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold tracking-tight sm:text-6xl"
      >
        The Science Behind Straps
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mx-auto mt-4 max-w-3xl text-lg text-zinc-300"
      >
        Evidence-based reasons to use lifting straps: optimize stimulus to the target musculature, manage fatigue, and train safely across rep ranges.
      </motion.p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur">
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-sm text-zinc-300">{label}</div>
    </div>
  );
}

function StatsRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
    >
      <Stat value="> 20%" label="Longer time-under-tension before grip fails" />
      <Stat value="↓ RPE" label="Lower perceived exertion at equal load" />
      <Stat value="↑ Volume" label="More quality reps per session" />
      <Stat value="↑ Safety" label="Secure interface on heavy sets" />
    </motion.div>
  );
}

function Card({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 p-5 transition-transform hover:-translate-y-1">
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-rose-400/10 blur-3xl transition-opacity group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/10 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-zinc-300">{body}</p>
        </div>
      </div>
    </div>
  );
}

function WhyUseStraps() {
  return (
    <div className="mt-14">
      <h3 className="text-xl font-bold tracking-wide">Why Use Straps</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          icon={Dumbbell}
          title="Prioritize the Prime Movers"
          body="Your back and posterior chain can handle more load than your finger flexors. Straps let spinal erectors, lats, and traps take center stage without premature grip failure."
        />
        <Card
          icon={Flame}
          title="Manage Local Fatigue"
          body="Reduce localized forearm fatigue to maintain bar path and rep quality across sets—especially during high-volume hypertrophy blocks."
        />
        <Card
          icon={ShieldCheck}
          title="Enhance Safety"
          body="A secure strap-bar interface reduces micro-slips, keeps the bar close, and supports consistent technique when approaching limit sets."
        />
        <Card
          icon={TimerReset}
          title="Extend Effective Reps"
          body="Push sets closer to effective proximity to failure for the target muscles instead of ending due to grip breakdown."
        />
        <Card
          icon={Brain}
          title="Motor Learning Consistency"
          body="Stable hand-bar contact improves kinesthetic feedback and repeatability—valuable when practicing RDLs, pulls, and hip hinges."
        />
        <Card
          icon={Activity}
          title="Better Load Progression"
          body="Keep progressive overload focused on posterior chain strength, not forearm endurance, when the session goal demands it."
        />
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-zinc-200">{children}</span>
  );
}

function WhoTheyHelp() {
  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold tracking-wide">Who They Help</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>Hypertrophy-focused lifters</Chip>
        <Chip>Pull days and posterior-chain blocks</Chip>
        <Chip>High-volume RDLs, rows, and pulldowns</Chip>
        <Chip>Injured/recovering hands or skin tears</Chip>
        <Chip>Long-armed lifters with extended ROM</Chip>
        <Chip>Advanced trainees close to limit loads</Chip>
        <Chip>Coaches managing fatigue distribution</Chip>
      </div>
    </div>
  );
}

function Bar({ label, a, b, aLabel, bLabel }: { label: string; a: number; b: number; aLabel: string; bLabel: string }) {
  const total = a + b;
  const aPct = (a / total) * 100;
  const bPct = (b / total) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
        <span>{label}</span>
        <span className="text-zinc-400">{aLabel} vs {bLabel}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div style={{ width: `${aPct}%` }} className="bg-rose-400/70" />
        <div style={{ width: `${bPct}%` }} className="bg-sky-400/70" />
      </div>
    </div>
  );
}

function WhatTheyImprove() {
  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold tracking-wide">What They Improve</h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>Time-under-tension on posterior chain before grip gives out</li>
            <li>Rep quality near fatigue due to reduced bar slip</li>
            <li>Load tolerance for hinge and row patterns</li>
            <li>Ability to separate grip training from back training when needed</li>
            <li>Technique consistency across heavy singles and volume sets</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="text-sm text-zinc-300">Simplified illustration: where the limiting factor shifts when adding straps</div>
          <div className="mt-4 space-y-4">
            <Bar label="Heavy RDL Set" a={65} b={35} aLabel="Target muscles" bLabel="Grip" />
            <Bar label="High-Rep Rows" a={60} b={40} aLabel="Target muscles" bLabel="Grip" />
            <Bar label="Volume Deadlifts" a={55} b={45} aLabel="Target muscles" bLabel="Grip" />
          </div>
          <div className="mt-3 text-xs text-zinc-500">Illustrative only; exact distributions vary by individual and context.</div>
        </div>
      </div>
    </div>
  );
}

function MechanicsExplainer() {
  return (
    <div className="mt-14 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Beaker className="h-4 w-4" /> Mechanism Overview
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div>
          <h4 className="text-lg font-bold">Load Transfer</h4>
          <p className="mt-2 text-sm text-zinc-300">
            Straps create a friction-locked loop that transfers a portion of the load path from finger flexors to the wrist-strap interface, delaying local forearm fatigue and preserving grip stability.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-bold">Motor Output Allocation</h4>
          <p className="mt-2 text-sm text-zinc-300">
            With fewer neural resources devoted to maximum gripping, more output is available to the prime movers (lats, traps, erectors), improving effective reps and maintaining bar path under fatigue.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-bold">Technique Stability</h4>
          <p className="mt-2 text-sm text-zinc-300">
            Reduced micro-slips decrease shearing at the hand-bar interface, yielding more consistent proprioceptive feedback and safer joint stacking through the pull.
          </p>
        </div>
      </div>
    </div>
  );
}

function Citations() {
  return (
    <div className="mt-10 text-sm text-zinc-400">
      <p className="leading-relaxed">
        Notes: Practical strength and hypertrophy programming often separates grip development from posterior-chain overload to better manage systemic and local fatigue. Strap use is context-dependent and complements, not replaces, dedicated grip training.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Programming frameworks emphasize proximity to failure for target muscles when the session goal is hypertrophy.</li>
        <li>Grip training can be scheduled independently (e.g., holds, crush, pinch) to avoid interfering with back-day objectives.</li>
      </ul>
    </div>
  );
}

function CTA() {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 text-center">
      <div className="text-lg text-zinc-300">Ready to train smarter and safer?</div>
      <a
        href="#products"
        className="rounded-full bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        Explore Straps
      </a>
    </div>
  );
}

