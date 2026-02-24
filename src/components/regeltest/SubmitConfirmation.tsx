"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SubmitConfirmationProps {
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SubmitConfirmation({
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
}: SubmitConfirmationProps) {
  const unanswered = totalCount - answeredCount;
  const constraintsRef = useRef(null);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0]);
  const backdropOpacity = useTransform(y, [0, 200], [0.5, 0]);

  function handleDragEnd(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      animate(y, 400, { duration: 0.2 }).then(onCancel);
    } else {
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black"
        style={{ opacity: backdropOpacity }}
        onClick={onCancel}
      />

      {/* Sheet */}
      <motion.div
        className="relative mx-0 sm:mx-4 w-full sm:max-w-md rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-xl)] bg-surface p-7 shadow-xl"
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ y, opacity }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-fill-active sm:hidden" />

        <h3 id="submit-dialog-title" className="mb-2 text-lg font-bold text-text-primary">
          Test abgeben?
        </h3>
        <p className="mb-1 text-sm text-text-secondary">
          Du hast {answeredCount} von {totalCount} Fragen beantwortet.
        </p>
        {unanswered > 0 && (
          <p className="mb-4 text-sm font-medium text-warning-text">
            {unanswered} Frage{unanswered > 1 ? "n" : ""} noch offen (0 Punkte).
          </p>
        )}
        {unanswered === 0 && <div className="mb-4" />}
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={onCancel} className="flex-1">
            Abbrechen
          </Button>
          <Button size="lg" onClick={onConfirm} className="flex-1">
            Abgeben
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
