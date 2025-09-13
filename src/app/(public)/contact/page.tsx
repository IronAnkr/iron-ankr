"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Mail, Phone, MapPin, Send, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("contact_messages").insert({ name, email, message });
      if (error) throw error;
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Contact</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            We’re here to help. Reach out with product questions, orders, or feedback.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-border/60 bg-card/70 p-6"
          >
            <h2 className="text-lg font-semibold">Send us a message</h2>

            {submitted && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm border-green-600/30 bg-green-500/10 text-green-800 dark:border-green-400/30 dark:bg-green-400/10 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Message sent. We’ll get back within 1–2 business days.
              </div>
            )}
            {error && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm border-rose-600/30 bg-rose-500/10 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100">
                <AlertTriangle className="h-4 w-4" />
                {error}
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
                  className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none border-border/60 bg-background/50 text-foreground focus:border-border"
                  disabled={submitting}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none border-border/60 bg-background/50 text-foreground focus:border-border"
                    disabled={submitting}
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
                  className="w-full resize-y rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none border-border/60 bg-background/50 text-foreground focus:border-border"
                  disabled={submitting}
                />
              </Field>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">By sending, you agree to our terms and privacy policy.</p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
                  disabled={submitting}
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
              <a className="underline hover:text-foreground" href="mailto:support@ironankr.fit">support@ironankr.fit</a>
            </InfoCard>
            <InfoCard icon={<Phone className="h-4 w-4" />} title="Phone">
              <span className="text-muted-foreground">+1 (555) 010-2025</span>
            </InfoCard>
            <InfoCard icon={<MapPin className="h-4 w-4" />} title="Address">
              <span className="text-muted-foreground">321 Harbor Ave, Suite 10, Portland, OR</span>
            </InfoCard>
            <InfoCard icon={<Clock className="h-4 w-4" />} title="Hours">
              <span className="text-muted-foreground">Mon–Fri, 9:00–17:00 PT</span>
            </InfoCard>
            <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
              Prefer self-serve? Check the <a className="underline hover:text-foreground" href="/faq">FAQ</a> for instant answers.
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
      <span className="mb-1 block text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-content-center rounded-lg bg-foreground/10">{icon}</span>
        {title}
      </div>
      <div className="text-sm text-foreground/90">{children}</div>
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
