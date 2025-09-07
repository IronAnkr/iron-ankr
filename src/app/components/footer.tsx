"use client";

import { motion } from "framer-motion";
import { Instagram, Youtube, Twitter, ArrowRight, ShieldCheck, Mail, Globe } from "lucide-react";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { FormEvent, useState } from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Placeholder submit — wire to your backend/email provider
    console.log("Subscribe:", email);
    setEmail("");
  };

  return (
    <footer
      className={cn(
        "relative w-full overflow-hidden",
        "bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)]",
        "text-white"
      )}
    >
      <BackgroundGrid />

      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Iron ankr" width={36} height={36} />
              <span className="text-lg font-semibold tracking-wide">Iron ankr</span>
            </div>
            <p className="max-w-md text-sm text-zinc-300">
              Precision gear for serious pulling. Built to amplify stimulus, manage fatigue, and keep you lifting safely.
            </p>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Engineered for repeatable performance</span>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 text-sm md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold tracking-wide">Explore</h4>
              <ul className="space-y-2 text-zinc-300">
                <li><a className="hover:text-white" href="#products">Products</a></li>
                <li><a className="hover:text-white" href="#">About</a></li>
                <li><a className="hover:text-white" href="#">Contact</a></li>
                <li><a className="hover:text-white" href="#">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-semibold tracking-wide">Resources</h4>
              <ul className="space-y-2 text-zinc-300">
                <li><a className="hover:text-white" href="#">Sizing & Fit</a></li>
                <li><a className="hover:text-white" href="#">Care Guide</a></li>
                <li><a className="hover:text-white" href="#">Returns</a></li>
                <li><a className="hover:text-white" href="#">Warranty</a></li>
              </ul>
            </div>
          </nav>

          <div className="space-y-4">
            <h4 className="font-semibold tracking-wide">Stay in the loop</h4>
            <p className="text-sm text-zinc-300">Training tips, product drops, and early access.</p>

            <form onSubmit={onSubmit} className="relative">
              <div className="group relative overflow-hidden rounded-full border border-white/15 bg-zinc-950/70 p-[1px]">
                <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-0 flex-1 bg-transparent text-sm placeholder:text-zinc-500 focus:outline-none"
                    aria-label="Email address"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
                  >
                    Subscribe <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center gap-3 pt-1">
              <IconLink ariaLabel="Instagram" href="#">
                <Instagram className="h-4 w-4" />
              </IconLink>
              <IconLink ariaLabel="X (Twitter)" href="#">
                <Twitter className="h-4 w-4" />
              </IconLink>
              <IconLink ariaLabel="YouTube" href="#">
                <Youtube className="h-4 w-4" />
              </IconLink>
              <IconLink ariaLabel="Website" href="#">
                <Globe className="h-4 w-4" />
              </IconLink>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-zinc-400">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <span>© {year} Iron ankr. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a className="hover:text-white" href="#">Privacy</a>
              <a className="hover:text-white" href="#">Terms</a>
              <a className="hover:text-white" href="#">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function IconLink({ children, href, ariaLabel }: { children: React.ReactNode; href: string; ariaLabel: string }) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className="group relative overflow-hidden rounded-full border border-white/15 p-2 transition-colors hover:border-white/40"
    >
      <span className="absolute inset-0 -z-10 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      {children}
    </a>
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

