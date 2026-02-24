import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/8 disabled:bg-fill-hover disabled:opacity-50",
            error && "border-error focus:border-error focus:ring-ring-error",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
