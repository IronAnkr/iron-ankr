"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Mail, Phone, MapPin, Send, Clock, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Placeholder: wire to API or form provider
    console.log("Contact submit", { name, email, message });
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.25),transparent_50%),",
        "radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.25),transparent_50%)] py-20 text-white"
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
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Contact</h1>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
            We’re here to help. Reach out with product questions, orders, or feedback.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6"
          >
            <h2 className="text-lg font-semibold">Send us a message</h2>

            {submitted && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-400/10 px-3 py-2 text-sm text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Message sent. We’ll get back within 1–2 business days.
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus:border-white/30 focus:outline-none"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus:border-white/30 focus:outline-none"
                  />
                </Field>
              </div>

              <Field label="Message">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  placeholder="How can we help?"
                  className="w-full resize-y rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus:border-white/30 focus:outline-none"
                />
              </Field>

              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">By sending, you agree to our terms and privacy policy.</p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Send Message <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-4"
          >
            <InfoCard icon={<Mail className="h-4 w-4" />} title="Email">
              <a className="underline hover:text-white" href="mailto:support@ironanchor.fit">support@ironanchor.fit</a>
            </InfoCard>
            <InfoCard icon={<Phone className="h-4 w-4" />} title="Phone">
              <span className="text-zinc-300">+1 (555) 010-2025</span>
            </InfoCard>
            <InfoCard icon={<MapPin className="h-4 w-4" />} title="Address">
              <span className="text-zinc-300">321 Harbor Ave, Suite 10, Portland, OR</span>
            </InfoCard>
            <InfoCard icon={<Clock className="h-4 w-4" />} title="Hours">
              <span className="text-zinc-300">Mon–Fri, 9:00–17:00 PT</span>
            </InfoCard>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              Prefer self-serve? Check the <a className="underline hover:text-white" href="/faq">FAQ</a> for instant answers.
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-content-center rounded-lg bg-white/10">{icon}</span>
        {title}
      </div>
      <div className="text-sm">{children}</div>
    </div>
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

