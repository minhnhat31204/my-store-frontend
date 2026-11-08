"use client";

import React, { useEffect } from "react";
import { AnimatedModal, AnimatedButton } from "@/app/components/ui/motion-primitives";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = "Xác nhận xóa",
  message = "Bạn có chắc chắn muốn xóa không? Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi hệ thống và không thể hoàn tác.",
  confirmText = "Xác nhận xóa",
  cancelText = "Hủy bỏ",
  isDanger = true,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  return (
    <AnimatedModal isOpen={isOpen} onClose={!isLoading ? onClose : undefined} maxWidth="max-w-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl flex-shrink-0 ${
              isDanger
                ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                : "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
            }`}
          >
            {isDanger ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <AnimatedButton
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
          >
            {cancelText}
          </AnimatedButton>
          <AnimatedButton
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition flex items-center gap-2 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
            } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </AnimatedButton>
        </div>
      </div>
    </AnimatedModal>
  );
}
