'use client';

import React from 'react';

export type DateFilterPeriod = 'today' | '7days' | 'month' | 'all' | 'custom';

interface DateFilterBarProps {
  value: DateFilterPeriod;
  customDate?: string;
  onChange: (value: DateFilterPeriod, customDate?: string) => void;
  className?: string;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function matchesDateFilter(
  rawDate: string | Date | null | undefined,
  period: DateFilterPeriod,
  customDate?: string
): boolean {
  if (!rawDate) return period === 'all';
  const target = new Date(rawDate);
  if (Number.isNaN(target.getTime())) return period === 'all';

  const now = new Date();

  switch (period) {
    case 'today':
      return isSameDay(target, now);
    case '7days': {
      const diffTime = now.getTime() - target.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    case 'month':
      return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth();
    case 'custom': {
      if (!customDate) return true;
      const [year, month, day] = customDate.split('-').map(Number);
      return (
        target.getFullYear() === year &&
        target.getMonth() === month - 1 &&
        target.getDate() === day
      );
    }
    case 'all':
    default:
      return true;
  }
}

export default function DateFilterBar({
  value,
  customDate = '',
  onChange,
  className = '',
}: DateFilterBarProps) {
  const todayStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const options: Array<{ key: DateFilterPeriod; label: string; badge?: boolean }> = [
    { key: 'today', label: `Hôm nay (${todayStr})`, badge: true },
    { key: '7days', label: '7 ngày qua' },
    { key: 'month', label: 'Tháng này' },
    { key: 'all', label: 'Tất cả' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      <span className="font-bold text-slate-400 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Lọc theo ngày:
      </span>

      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
        {options.map((opt) => {
          const isSelected = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && opt.badge && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          );
        })}

        {/* Custom date picker */}
        <div className="relative flex items-center pl-1 border-l border-slate-800">
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              if (e.target.value) {
                onChange('custom', e.target.value);
              }
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition outline-none cursor-pointer ${
              value === 'custom'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
