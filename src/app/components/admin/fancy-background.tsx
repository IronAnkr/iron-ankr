export function FancyBackground() {
  return (
    <div aria-hidden className="pointer-events-none relative inset-0 -z-50 overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at top left, black 35%, transparent 65%), radial-gradient(ellipse at bottom right, black 35%, transparent 65%)",
        }}
      />

      {/* Radial glow accents */}
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25),transparent_60%)] blur-2xl" />
      <div className="absolute -bottom-40 -right-28 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.22),transparent_60%)] blur-2xl" />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,.25))]" />
    </div>
  );
}
