import { cn } from "@/utils/cn";

type Props = {
  className?: string;
};

export default function GradientOverlay({ className }: Props) {

  return (
    <div
      className={cn(
        !className && "z-10 absolute inset-0 pointer-events-none",
        className,
        "bg-gradient-to-b from-white via-white/50 to-white dark:invert invert-0"
      )}
    />
  );
}
