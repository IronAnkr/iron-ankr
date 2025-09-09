"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type BannerMessageT } from "@/db/schema";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

const HIDE_KEY = "ia_banner_hidden_session";

function activeList(banners: BannerMessageT[]): BannerMessageT[] {
  const now = new Date();
  return banners
    .filter((b) => b.active && (b.starts_at ? now >= new Date(b.starts_at) : true) && (b.ends_at ? now <= new Date(b.ends_at) : true))
    .sort((a, b) => (b.priority - a.priority) || (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
}

export function PublicBanner() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [banners, setBanners] = useState<BannerMessageT[]>([]);
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Refs for measuring DOM elements
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // State to manage the scrolling animation
  const [scrollDistance, setScrollDistance] = useState(0);

  const load = useCallback(async () => {
    // Query a small slice of active banners; apply time filtering client-side
    const { data } = await supabase
      .from("banner_messages")
      .select("id,message,link_url,variant,priority,starts_at,ends_at,active,metadata,created_at,updated_at,deleted_at")
      .eq("active", true)
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(20);
    const list = activeList((data as BannerMessageT[]) || []);
    setBanners(list);
    setIndex(0);
  }, [supabase]);

  useEffect(() => {
    try { setHidden(sessionStorage.getItem(HIDE_KEY) === "1"); } catch {}
    void load();
    // Realtime updates for banners
    const channel = supabase
      .channel("public:banner_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banner_messages" },
        () => void load()
      )
      .subscribe();
    // Periodic refresh as a fallback
    const t = setInterval(() => { void load(); }, 60_000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(t);
    };
  }, [supabase, load]);

  // Rotate through banners
  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!banners.length) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 7000); // 7s per banner
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [banners]);

  const banner = banners[index] || null;

  // Callback to measure overflow. Stable reference via useCallback.
  const checkOverflow = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current;
      const contentWidth = contentRef.current.scrollWidth;
      const containerWidth = container.clientWidth;
      const isOverflowing = contentWidth > containerWidth;

      if (isOverflowing) {
        // Get the computed style to account for padding
        const style = window.getComputedStyle(container);
        const paddingRight = parseFloat(style.paddingRight) || 0;
        setScrollDistance(contentWidth - containerWidth + paddingRight);
      } else {
        setScrollDistance(0);
      }
    } else {
      setScrollDistance(0);
    }
  }, []);

  // Use layout effect to measure the DOM right after it paints
  useLayoutEffect(() => {
    // Reset scroll state for new banner
    setScrollDistance(0);
    // A resize can change the overflow status
    window.addEventListener("resize", checkOverflow);
    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [banner, checkOverflow]); // Re-run when banner or the callback changes

  if (!banner || hidden) return null;
  const styles = variantToStyles(banner.variant);
  const isOverflowing = scrollDistance > 0;

  // Base speed: 75px/sec. Adjust duration based on how much it needs to scroll.
  const scrollDuration = isOverflowing ? scrollDistance / 75 : 0;

  function close() {
    try {
      sessionStorage.setItem(HIDE_KEY, "1");
    } catch {}
    setHidden(true);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-b-lg" aria-live="polite" aria-atomic>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, rotateX: -80, y: -10 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, rotateX: 80, y: 10 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          // Trigger measurement after the entrance animation completes
          onAnimationComplete={checkOverflow}
          className={`relative flex w-full items-stretch origin-top ${styles.border} ${styles.bg} ${styles.text} backdrop-blur-xl supports-[backdrop-filter:blur(0px)]:backdrop-blur-xl shadow-[0_6px_20px_rgba(0,0,0,.35)]`}
        >
          <div ref={containerRef} className={"flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-xs font-medium overflow-hidden"}>
            <motion.div
              ref={contentRef}
              key={`${banner.id}-content`} // Unique key to ensure animation state resets
              className="whitespace-nowrap"
              initial={{ x: 0 }}
              animate={{ x: isOverflowing ? -scrollDistance : 0 }}
              transition={{
                delay: 1.5, // Wait 1.5s before starting scroll
                duration: scrollDuration,
                ease: "linear",
              }}
            >
              {banner.link_url ? (
                <Link href={banner.link_url} className="hover:underline">
                  {banner.message}
                </Link>
              ) : (
                <span>{banner.message}</span>
              )}
            </motion.div>
          </div>
          <button
            aria-label="Dismiss announcement"
            onClick={close}
            className={"px-3 hover:bg-white/10 transition-colors"}
          >
            ×
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function variantToStyles(variant: BannerMessageT["variant"]) {
  switch (variant) {
    case "success":
      return { bg: "bg-emerald-500/25", text: "text-emerald-100", border: "border-t border-emerald-500/30" };
    case "warning":
      return { bg: "bg-amber-500/25", text: "text-amber-100", border: "border-t border-amber-500/30" };
    case "error":
      return { bg: "bg-rose-500/25", text: "text-rose-100", border: "border-t border-rose-500/30" };
    default:
      return { bg: "bg-sky-500/25", text: "text-sky-100", border: "border-t border-sky-500/30" };
  }
}
