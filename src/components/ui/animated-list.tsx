"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
}

export function AnimatedList({
  children,
  className,
  staggerMs = 60,
}: AnimatedListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 26,
            delay: i * (staggerMs / 1000),
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
