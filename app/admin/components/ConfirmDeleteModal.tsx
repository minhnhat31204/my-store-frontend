'use client';

import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  itemType?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Xác nhận xóa dữ liệu',
  itemName,
  itemType = 'mục',
  description,
  confirmText = 'Xóa vĩnh viễn',
  cancelText = 'Hủy bỏ',
  isDeleting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl text-slate-200 animate-scaleUp">
        {/* Warning Icon & Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 inline-block mb-1">
              Hành động nguy hiểm
            </span>
            <h3 className="text-lg font-black text-white">{title}</h3>
          </div>
        </div>

        {/* Content Details */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-2 text-xs">
          {itemName ? (
            <p className="text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa {itemType}:{' '}
              <strong className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {itemName}
              </strong>{' '}
              khỏi hệ thống không?
            </p>
          ) : (
            <p className="text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa {itemType} này khỏi hệ thống không?
            </p>
          )}

          <p className="text-slate-400 leading-relaxed">
            {description || 'Dữ liệu sau khi xóa sẽ không thể phục hồi lại được.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
