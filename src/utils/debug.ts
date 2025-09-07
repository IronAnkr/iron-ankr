// Simple debug logging helpers for client and server

const serverEnabled = Boolean(
  process.env.DEBUG_AUTH === "1" || process.env.NEXT_PUBLIC_DEBUG_AUTH === "1"
);

export function serverLog(ns: string, ...args: unknown[]) {
  if (serverEnabled) {
    console.log(`[auth:${ns}]`, ...args);
  }
}

export function clientLog(ns: string, ...args: unknown[]) {
  try {
    const enabled =
      typeof window !== "undefined" &&
      (localStorage.getItem("IA_DEBUG_AUTH") === "1" ||
        process.env.NEXT_PUBLIC_DEBUG_AUTH === "1");
    if (enabled) {
      console.log(`[auth:${ns}]`, ...args);
    }
  } catch {
    // ignore
  }
}
