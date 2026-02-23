"use client";

import { useEffect } from "react";
import { useSpring, useTransform, motion, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  className,
  suffix = "",
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 20,
    mass: 0.5,
  });

  const display = useTransform(spring, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (prefersReducedMotion) {
      spring.jump(value);
    } else {
      spring.set(value);
    }
  }, [value, spring, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <span className={className}>{value}{suffix}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}
