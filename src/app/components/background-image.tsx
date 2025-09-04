"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function BackgroundImage({src}:{src:string}) {
  // Smooth, subtle parallax using rAF + easing
  const [offset, setOffset] = useState(0);
  const targetY = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      // Store target scroll position; update visual offset in rAF loop
      targetY.current = typeof window !== "undefined" ? window.scrollY : 0;
    };

    // Kick once and subscribe
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // rAF loop to ease toward target for smoothness
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setOffset(prev => prev + (targetY.current - prev) * 0.25); // ease
      rafId.current = window.requestAnimationFrame(tick);
    };
    rafId.current = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      window.removeEventListener("scroll", onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const strength = 0.15; // subtle parallax strength
  const translateY = Math.round(offset * strength);

  return (
    <Image
      src={src}
      alt="hero background"
      className="object-cover blur-sm -z-10"
      style={{
        transform: `translate3d(0, ${translateY}px, 0)`,
        willChange: "transform",
      }}
      fill
      priority
    />
  );
}
