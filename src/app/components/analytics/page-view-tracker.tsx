"use client";
import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type StartResponse = { id: string };

function uuidv4() {
  // Simple UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getDeviceId(): string {
  try {
    const key = "pv_device_id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const fresh = uuidv4();
    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return uuidv4();
  }
}

function computeFingerprint(): string {
  try {
    const nav = navigator as any;
    const parts = [
      navigator.userAgent,
      navigator.language,
      nav?.platform,
      String(screen.width),
      String(screen.height),
      String(screen.colorDepth),
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    ].join("|");
    // Lightweight hash
    let hash = 0;
    for (let i = 0; i < parts.length; i++) {
      const chr = parts.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // 32-bit
    }
    return `fp_${Math.abs(hash)}`;
  } catch {
    return "fp_unknown";
  }
}

async function postJSON(url: string, body: unknown, opts?: { keepalive?: boolean }) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: opts?.keepalive,
  });
}

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentIdRef = useRef<string | null>(null);
  const deviceId = useMemo(getDeviceId, []);
  const fingerprint = useMemo(computeFingerprint, []);
  const startedAtRef = useRef<number | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const endingRef = useRef(false);

  useEffect(() => {
    const url = typeof window !== "undefined" ? window.location.href : pathname;
    const referrer = document.referrer || lastUrlRef.current || "";
    lastUrlRef.current = url;

    const start = async () => {
      try {
        const payload = {
          action: "start" as const,
          page_url: url,
          path: pathname,
          search: searchParams?.toString() ?? "",
          title: document.title,
          referrer,
          device_id: deviceId,
          fingerprint,
          viewport: { w: window.innerWidth, h: window.innerHeight },
          screen: { w: screen.width, h: screen.height, d: screen.colorDepth },
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        };
        const res = await postJSON("/api/analytics/page-view", payload);
        if (!res.ok) return;
        const data = (await res.json()) as StartResponse;
        currentIdRef.current = data.id;
        startedAtRef.current = Date.now();
      } catch {
        // swallow
      }
    };

    // End previous view before starting new one
    const endPrevious = async () => {
      if (!currentIdRef.current || endingRef.current) return;
      endingRef.current = true;
      const id = currentIdRef.current;
      try {
        const endPayload = { action: "end" as const, id };
        // Prefer sendBeacon for unload-safety
        const blob = new Blob([JSON.stringify(endPayload)], { type: "application/json" });
        const ok = navigator.sendBeacon?.("/api/analytics/page-view", blob) ?? false;
        if (!ok) {
          await postJSON("/api/analytics/page-view", endPayload, { keepalive: true });
        }
      } catch {
        // ignore
      } finally {
        endingRef.current = false;
        currentIdRef.current = null;
        startedAtRef.current = null;
      }
    };

    // When path/search changes, end prior and start new
    (async () => {
      await endPrevious();
      await start();
    })();

    // On tab hide/unload, end current view
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (!currentIdRef.current || endingRef.current) return;
        endingRef.current = true;
        const id = currentIdRef.current;
        const endPayload = { action: "end" as const, id };
        const blob = new Blob([JSON.stringify(endPayload)], { type: "application/json" });
        const ok = navigator.sendBeacon?.("/api/analytics/page-view", blob) ?? false;
        if (!ok) {
          postJSON("/api/analytics/page-view", endPayload, { keepalive: true });
        }
      }
    };
    const onBeforeUnload = () => {
      if (!currentIdRef.current) return;
      const id = currentIdRef.current;
      const endPayload = { action: "end" as const, id };
      const blob = new Blob([JSON.stringify(endPayload)], { type: "application/json" });
      navigator.sendBeacon?.("/api/analytics/page-view", blob);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [pathname, searchParams, deviceId, fingerprint]);

  return null;
}

