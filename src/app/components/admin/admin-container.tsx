import { cn } from "@/utils/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
};

export function AdminContainer({ className, size = "lg", ...props }: Props) {
  const max = size === "sm" ? "max-w-4xl" : size === "md" ? "max-w-6xl" : "max-w-7xl";
  return (
    <div className={cn("w-full mx-auto px-4 md:px-6 lg:px-8", max, className)} {...props} />
  );
}

