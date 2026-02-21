import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        "text-[17px] font-normal tracking-[0.04em] text-gray-500 select-none",
        className
      )}
      aria-label="schiri"
    >
      schiri
    </span>
  );
}
