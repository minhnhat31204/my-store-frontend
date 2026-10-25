'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getPrimaryProductImage, type ProductReview } from '@/lib/api';
import Pagination from '@/app/admin/components/Pagination';

function dateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminReviews();
      const rows = Array.isArray(data) ? data : [];
      setReviews(rows);
      setReplies(Object.fromEntries(rows.map((review) => [review.ReviewID, review.AdminReply || ''])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReviews(); }, []);

  const groups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    const filtered = reviews.filter((review) => !query || [
      review.Product?.ProductName,
      review.User?.FullName,
      review.Comment,
      review.AdminReply,
      String(review.OrderID || ''),
      String(review.ProductID),
    ].some((value) => String(value || '').toLocaleLowerCase('vi').includes(query)));
    const grouped = new Map<number, { name: string; image?: string | null; reviews: ProductReview[] }>();
    for (const review of filtered) {
      const productId = Number(review.ProductID);
      const group = grouped.get(productId) || {
        name: review.Product?.ProductName || `Sản phẩm #${productId}`,
        image: review.Product?.ImageUrl,
        reviews: [],
      };
      group.reviews.push(review);
      grouped.set(productId, group);
    }
    return [...grouped.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name, 'vi'));
  }, [reviews, search]);
  const totalPages = Math.max(1, Math.ceil(groups.length / 20));
  const currentPage = Math.min(page, totalPages);
  const visibleGroups = groups.slice((currentPage - 1) * 20, currentPage * 20);

  async function saveReply(review: ProductReview) {
    const reply = (replies[review.ReviewID] || '').trim();
    if (!reply) {
      setFeedback((current) => ({ ...current, [review.ReviewID]: 'Vui lòng nhập nội dung phản hồi.' }));
      return;
    }
    setSavingId(review.ReviewID);
    setFeedback((current) => ({ ...current, [review.ReviewID]: '' }));
    try {
      const result = await api.replyToReview(review.ReviewID, reply);
      setReviews((current) => current.map((item) => item.ReviewID === review.ReviewID ? result.review : item));
      setReplies((current) => ({ ...current, [review.ReviewID]: result.review.AdminReply || reply }));
      setFeedback((current) => ({ ...current, [review.ReviewID]: result.message || 'Đã lưu phản hồi.' }));
    } catch (err) {
      setFeedback((current) => ({ ...current, [review.ReviewID]: err instanceof Error ? err.message : 'Không thể lưu phản hồi.' }));
    } finally {
      setSavingId(null);
    }
  }

  const totalReplies = reviews.filter((review) => Boolean(review.AdminReply?.trim())).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fadeIn">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <span className="mb-2 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">★ Phản hồi khách hàng</span>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Đánh giá sản phẩm</h1>
          <p className="mt-1 text-sm text-slate-400">{reviews.length} đánh giá · {totalReplies} phản hồi · {groups.length} sản phẩm</p>
        </div>
        <button type="button" onClick={() => void loadReviews()} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Đang tải…' : 'Làm mới'}
        </button>
      </section>

      <label className="block">
        <span className="sr-only">Tìm sản phẩm hoặc đánh giá</span>
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm theo tên sản phẩm, khách hàng hoặc nội dung đánh giá…" className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500" />
      </label>

      {error && <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-300">{error}</p>}
      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-14 text-center text-slate-400">Đang tải đánh giá…</div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-14 text-center text-slate-400">{reviews.length ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá sản phẩm nào.'}</div>
      ) : (
        <div className="space-y-5">
          {visibleGroups.map(([productId, group]) => (
            <section key={productId} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
              <header className="flex items-center gap-4 border-b border-slate-800 bg-slate-950/60 p-4 sm:p-5">
                {group.image ? <img src={getPrimaryProductImage(group.image)} alt="" className="h-14 w-14 rounded-xl border border-slate-800 bg-white object-contain p-1" /> : <div className="grid h-14 w-14 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-xl text-slate-500">▧</div>}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-black text-white">{group.name}</h2>
                  <p className="mt-1 text-xs text-slate-400">Mã sản phẩm #{productId} · {group.reviews.length} đánh giá</p>
                </div>
              </header>
              <div className="divide-y divide-slate-800">
                {group.reviews.map((review) => (
                  <article key={review.ReviewID} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-white">{review.User?.FullName || 'Khách hàng'}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">Đơn #{review.OrderID || '—'} · {dateTime(review.ReviewDate)}</p>
                        </div>
                        <span className="text-sm tracking-wider text-amber-400" aria-label={`${Number(review.Rating)} sao`}>{'★'.repeat(Math.min(5, Math.max(0, Number(review.Rating) || 0)))}{'☆'.repeat(5 - Math.min(5, Math.max(0, Number(review.Rating) || 0)))}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-950/70 p-3 text-sm leading-relaxed text-slate-300">{review.Comment?.trim() || 'Khách hàng không để lại nội dung.'}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-900/50 bg-blue-950/20 p-3.5">
                      <label htmlFor={`review-reply-${review.ReviewID}`} className="mb-2 block text-xs font-bold text-blue-300">Phản hồi của admin</label>
                      <textarea id={`review-reply-${review.ReviewID}`} rows={4} maxLength={4000} value={replies[review.ReviewID] || ''} onChange={(event) => setReplies((current) => ({ ...current, [review.ReviewID]: event.target.value }))} placeholder="Viết phản hồi hiển thị công khai bên dưới đánh giá…" className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs leading-relaxed text-white outline-none placeholder:text-slate-500 focus:border-blue-500" />
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">{review.AdminReplyAt ? `Cập nhật ${dateTime(review.AdminReplyAt)}` : 'Chưa phản hồi'} · {(replies[review.ReviewID] || '').length}/4000</span>
                        <button type="button" onClick={() => void saveReply(review)} disabled={savingId === review.ReviewID || !(replies[review.ReviewID] || '').trim()} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{savingId === review.ReviewID ? 'Đang lưu…' : review.AdminReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}</button>
                      </div>
                      {feedback[review.ReviewID] && <p role="status" className={`mt-2 text-xs font-semibold ${feedback[review.ReviewID].includes('Đã lưu') ? 'text-emerald-400' : 'text-rose-300'}`}>{feedback[review.ReviewID]}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Pagination currentPage={currentPage} totalItems={groups.length} onPageChange={setPage} />
    </div>
  );
}
