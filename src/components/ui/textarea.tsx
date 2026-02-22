import { cn } from "@/lib/utils";
import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-fill-hover disabled:opacity-50 resize-none",
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

Textarea.displayName = "Textarea";
