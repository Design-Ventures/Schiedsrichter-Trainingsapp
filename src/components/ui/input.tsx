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
            className="mb-1.5 block text-sm font-medium text-dfb-dark"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-dfb-dark placeholder:text-gray-400 transition-colors focus:border-dfb-green focus:outline-none focus:ring-2 focus:ring-dfb-green/20 disabled:bg-gray-50 disabled:opacity-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
