"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Search, HelpCircle, ChevronDown, Mail } from "lucide-react";

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  {
    q: "Why use lifting straps?",
    a: "Straps delay local forearm fatigue so your back and posterior chain can accumulate more quality reps. They stabilize the bar interface, improve technique consistency, and support safer heavy sets when grip would otherwise fail first.",
  },
  {
    q: "Do straps make your grip weaker?",
    a: "No—use straps strategically for back-focused sessions and train grip separately (e.g., heavy holds, pinch work). This separates goals, letting you overload target muscles without compromising dedicated grip training.",
  },
  {
    q: "Which movements benefit most?",
    a: "RDLs, deadlifts, rows, pull-downs, rack pulls, and any hinge or pull variation where hands are the limiting factor before the prime movers.",
  },
  {
    q: "Classic vs. Figure-8 straps?",
    a: "Classic straps are versatile and quick to set. Figure-8s maximize security for heavy pulls and strongman-style work. Choose classic for general training and figure-8s for maximal holds.",
  },
  {
    q: "How do I care for them?",
    a: "Hand wash with mild soap, air dry flat, avoid high heat. Inspect stitching periodically and retire straps if you see fraying or compromised seams.",
  },
  {
    q: "What is your return policy?",
    a: "30-day hassle-free returns on unused items in original condition. Reach out to support and we’ll get you taken care of.",
  },
  {
    q: "When will my order ship?",
    a: "Most orders ship within 1–2 business days. You’ll receive tracking as soon as your order leaves the warehouse.",
  },
  {
    q: "Are your straps one-size?",
    a: "Classic straps are one-size and fit most lifters. Figure-8s come in sizes; choose smaller for a tighter lock and larger for a roomier fit or thicker bars.",
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <section
      className={cn(
        "system-theme relative w-full overflow-hidden",
        "bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)]",
        "py-32 text-foreground"
      )}
    >
      <BackgroundGrid />

      <div className="mx-auto w-full max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">FAQ</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Answers to common questions about straps, usage, shipping, and care.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-8 w-full max-w-xl"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQ..."
              className="w-full rounded-full border py-2 pl-9 pr-3 text-sm backdrop-blur focus:outline-none border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-border"
            />
          </div>
        </motion.div>

        <div className="mt-8 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/70">
          {results.map((item, idx) => (
            <AccordionItem
              key={idx}
              index={idx}
              q={item.q}
              a={item.a}
              open={open}
              setOpen={setOpen}
            />
          ))}
        </div>

        {results.length === 0 && (
          <div className="mt-16 text-center text-sm text-muted-foreground">No results. Try different keywords.</div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Mail className="h-4 w-4" />
          Still need help? <a className="underline hover:text-foreground" href="/contact">Contact support</a>
        </motion.div>
      </div>
    </section>
  );
}

function AccordionItem({
  index,
  q,
  a,
  open,
  setOpen,
}: {
  index: number;
  q: string;
  a: string;
  open: number | null;
  setOpen: (i: number | null) => void;
}) {
  const isOpen = open === index;
  return (
    <div>
      <button
        className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-background/50"
        onClick={() => setOpen(isOpen ? null : index)}
        aria-expanded={isOpen}
      >
        <HelpCircle className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-sm font-semibold">{q}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden px-4"
      >
        <div className="pb-4 text-sm text-muted-foreground">{a}</div>
      </motion.div>
      <div className="h-px w-full bg-border" />
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
