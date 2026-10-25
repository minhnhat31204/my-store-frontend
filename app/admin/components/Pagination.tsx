'use client';

type Props = {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  scrollTargetId?: string;
};

export default function Pagination({ currentPage, totalItems, pageSize = 20, onPageChange, scrollTargetId }: Props) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const firstVisible = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstVisible + index);

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    onPageChange(nextPage);
    requestAnimationFrame(() => {
      if (scrollTargetId) {
        const target = document.getElementById(scrollTargetId);
        if (target) {
          target.scrollTop = 0;
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }
      }
      const adminScroller = document.getElementById('admin-main-scroll');
      if (adminScroller) {
        adminScroller.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  return (
    <nav aria-label="Phân trang" className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-400">Hiển thị <span className="font-bold text-slate-200">{startItem}–{endItem}</span> trong <span className="font-bold text-slate-200">{totalItems}</span> mục</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Trước</button>
        {visiblePages.map((number) => (
          <button key={number} type="button" onClick={() => changePage(number)} aria-current={page === number ? 'page' : undefined} className={`min-w-9 rounded-lg border px-3 py-2 text-xs font-bold transition ${page === number ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}>{number}</button>
        ))}
        {firstVisible + visiblePages.length - 1 < totalPages && <>{firstVisible + visiblePages.length < totalPages && <span className="px-1 text-slate-500">…</span>}<button type="button" onClick={() => changePage(totalPages)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">{totalPages}</button></>}
        <button type="button" onClick={() => changePage(page + 1)} disabled={page >= totalPages} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Tiếp</button>
      </div>
    </nav>
  );
}
