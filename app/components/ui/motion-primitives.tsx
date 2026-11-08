"use client";

import React from "react";
import { motion, AnimatePresence, type HTMLMotionProps } from "motion/react";

/**
 * Animated Modal Wrapper - Drop-in spring animated modal with backdrop blur
 */
export function AnimatedModal({
  isOpen,
  onClose,
  children,
  className = "",
  maxWidth = "max-w-md",
}: {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop with fade-in and backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container with Spring Physics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{
              type: "spring",
              damping: 24,
              stiffness: 320,
              mass: 0.8,
            }}
            className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-3xl shadow-2xl ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Animated Card - Interactive Card with hover elevation, subtle scale, and border highlight
 */
export function AnimatedCard({
  children,
  className = "",
  hoverLift = true,
  onClick,
  ...props
}: HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  hoverLift?: boolean;
}) {
  return (
    <motion.div
      whileHover={
        hoverLift
          ? {
              y: -4,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }
          : undefined
      }
      whileTap={{ scale: 0.99 }}
      className={`transition-shadow duration-300 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated Button - Button with spring feedback on tap and hover
 */
export function AnimatedButton({
  children,
  className = "",
  disabled,
  onClick,
  type = "button",
  ...props
}: HTMLMotionProps<"button"> & {
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Animated Sliding Tab Indicator - Signature Animate-UI sliding pill
 */
export function AnimatedTabPill({ layoutId = "active-tab-pill", className = "" }: { layoutId?: string; className?: string }) {
  return (
    <motion.div
      layoutId={layoutId}
      className={`absolute inset-0 rounded-xl bg-blue-600 shadow-sm ${className}`}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  );
}

/**
 * Animated Glowing Background Aura - Ambient tech glow
 */
export function AnimatedHeroAura() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.55, 0.35],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.25, 0.45, 0.25],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-10 right-1/4 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"
      />
    </div>
  );
}
