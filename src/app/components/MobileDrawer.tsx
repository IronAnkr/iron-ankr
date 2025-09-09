"use client";

import { motion, useAnimation } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const links = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function MobileDrawer({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const controls = useAnimation();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      controls.start("open");
    } else {
      controls.start("closed");
    }
  }, [open, controls]);

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number }, velocity: { x: number; y: number } }) => {
    const drawerHeight = drawerRef.current?.clientHeight ?? 0;
    // If dragged down more than 20% of its height, or with a high velocity, close it
    if (info.offset.y > drawerHeight * 0.2 || info.velocity.y > 500) {
      setOpen(false);
    } else {
      // Otherwise, snap it back to the open state
      controls.start("open");
    }
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden ${open ? "" : "pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <motion.div
        ref={drawerRef}
        drag="y"
        onDragEnd={onDragEnd}
        initial="closed"
        animate={controls}
        variants={{
          open: { y: 0 },
          closed: { y: "100%" },
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        // Allow dragging down to close, but not up past the top
        dragConstraints={{ top: 0, bottom: 500 }}
        // Disable the bouncy effect when dragging up
        dragElastic={{ top: 0, bottom: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-50 h-[70vh] rounded-t-2xl bg-zinc-900/95 p-4 shadow-lg md:hidden"
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="mx-auto w-full max-w-lg">
          {/* Grab handle */}
          <div className="flex justify-center">
            <div className="h-1.5 w-16 rounded-full bg-zinc-700" />
          </div>

          {/* Links */}
          <div className="mt-8 flex flex-col items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-xl font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
