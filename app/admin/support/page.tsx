'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getStoredUser, type SupportConversation, type SupportMessage } from '@/lib/api';
import { useAdminGuard } from '@/lib/useAdminGuard';
import Pagination from '@/app/admin/components/Pagination';
import DateFilterBar, { matchesDateFilter, type DateFilterPeriod } from '@/app/admin/components/DateFilterBar';

export default function AdminSupportPage() {
  useAdminGuard();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [supportTab, setSupportTab] = useState<'unreplied' | 'replied'>('unreplied');
  const [dateFilter, setDateFilter] = useState<DateFilterPeriod>('today');
  const [customDate, setCustomDate] = useState('');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimConvId, setClaimConvId] = useState<number | null>(null);
  const [claimInputName, setClaimInputName] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [askingClose, setAskingClose] = useState(false);
  const messagesPane = useRef<HTMLDivElement>(null);

  const currentUser = getStoredUser();
  const currentAdminName = currentUser?.FullName || currentUser?.Username || 'Admin';

  const counts = useMemo(() => {
    let unreplied = 0;
    let replied = 0;
    for (const c of conversations) {
      if (c.AssignedAdminName) replied++;
      else unreplied++;
    }
    return { unreplied, replied, total: conversations.length };
  }, [conversations]);

  const refreshConversations = useCallback(async () => {
    try {
      const rows = await api.getSupportConversations();
      setConversations(rows);
      setSelectedId((current) => current && rows.some((row) => row.ConversationID === current) ? current : (rows[0]?.ConversationID ?? null));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải danh sách hộp thư');
    }
  }, []);

  const refreshMessages = useCallback(async (id: number) => {
    try {
      const result = await api.getSupportMessages(id, { role: 'Admin' });
      setMessages(result.messages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải nội dung hội thoại');
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
    const timer = window.setInterval(() => void refreshConversations(), 2500);
    return () => window.clearInterval(timer);
  }, [refreshConversations]);

  useEffect(() => {
    setMessages([]);
    if (!selectedId) return;
    void refreshMessages(selectedId);
    const timer = window.setInterval(() => void refreshMessages(selectedId), 1200);
    return () => window.clearInterval(timer);
  }, [selectedId, refreshMessages]);

  useEffect(() => {
    const pane = messagesPane.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [messages, selectedId]);

  async function handleClaimConfirm() {
    if (!claimConvId || !claimInputName.trim() || claimLoading) return;
    setClaimLoading(true);
    setError('');
    try {
      const res = await api.claimSupportConversation(claimConvId, {
        adminName: claimInputName.trim(),
        adminId: currentUser?.UserID
      });
      if (res.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c.ConversationID === claimConvId ? { ...c, ...res.conversation } : c))
        );
      }
      setSelectedId(claimConvId);
      setClaimModalOpen(false);
      setSupportTab('replied'); // Chuyển ngay sang mục Đã phản hồi
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nhận cuộc trò chuyện.');
    } finally {
      setClaimLoading(false);
    }
  }

  function handleSelectConversation(conversation: SupportConversation) {
    if (!conversation.AssignedAdminName) {
      setClaimConvId(conversation.ConversationID);
      setClaimInputName(currentAdminName);
      setClaimModalOpen(true);
    } else {
      setSelectedId(conversation.ConversationID);
    }
  }

  async function handleAskClose() {
    if (!selectedId || askingClose) return;
    setAskingClose(true);
    setError('');
    try {
      const activeConv = conversations.find((c) => c.ConversationID === selectedId);
      const res = await api.askCloseSupportConversation(selectedId, {
        adminName: activeConv?.AssignedAdminName || currentAdminName
      });
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi câu hỏi đóng phiên.');
    } finally {
      setAskingClose(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!selectedId || !message || sending) return;
    setSending(true);
    setError('');
    try {
      const user = getStoredUser();
      const activeConv = conversations.find((c) => c.ConversationID === selectedId);
      const adminSenderName = activeConv?.AssignedAdminName || user?.FullName || 'Quản trị viên';
      const result = await api.sendSupportMessage(selectedId, {
        role: 'Admin',
        userId: user?.UserID,
        senderName: adminSenderName,
        message
      });
      setMessages((current) => [...current, result.message]);
      setDraft('');
      void refreshConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gửi phản hồi thất bại');
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = conversations.filter((c) => {
    const isClaimed = Boolean(c.AssignedAdminName);
    if (supportTab === 'unreplied' && isClaimed) return false;
    if (supportTab === 'replied' && !isClaimed) return false;
    if (!matchesDateFilter(c.LastMessageAt || c.CreatedAt, dateFilter, customDate)) return false;

    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.CustomerName || '').toLowerCase().includes(query) ||
      (c.CustomerEmail || '').toLowerCase().includes(query) ||
      (c.LastMessage || '').toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / 20));
  const currentPage = Math.min(page, totalPages);
  const visibleConversations = filteredConversations.slice((currentPage - 1) * 20, currentPage * 20);

  const activeConversation = conversations.find((row) => row.ConversationID === selectedId);
  const isLockedByOtherAdmin = Boolean(
    activeConversation?.AssignedAdminName &&
    activeConversation.AssignedAdminName.toLowerCase() !== currentAdminName.toLowerCase()
  );
  const isChatClosed = activeConversation?.Status === 'Closed';

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh/0.72-130px)] min-h-[680px] gap-4 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800/80 shadow-2xl shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-1.5">
            💬 Phân hệ Hỗ trợ Khách hàng Trực tuyến
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Hộp Thư &amp; Tư Vấn Khách Hàng
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Tự động đồng bộ mỗi 3 giây</span>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-300 shrink-0">
          {error}
        </p>
      )}

      {/* Main 2-Pane Chat Box */}
      <div className="grid min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl md:grid-cols-[390px_minmax(0,1fr)]">
        {/* Left Side: Conversations List */}
        <aside className="flex min-h-0 flex-col border-b border-slate-800 md:border-b-0 md:border-r">
          <div className="p-3.5 border-b border-slate-800 space-y-2.5">
            {/* 2 Mục Chưa phản hồi & Đã phản hồi */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setSupportTab('unreplied'); setPage(1); }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  supportTab === 'unreplied'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Chưa phản hồi</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500/30 text-amber-200">
                  {counts.unreplied}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setSupportTab('replied'); setPage(1); }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  supportTab === 'replied'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Đã phản hồi</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-200">
                  {counts.replied}
                </span>
              </button>
            </div>

            {/* Date Filter Bar */}
            <DateFilterBar
              value={dateFilter}
              customDate={customDate}
              onChange={(period, date) => {
                setDateFilter(period);
                if (date) setCustomDate(date);
                setPage(1);
              }}
            />

            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
            {!filteredConversations.length && (
              <p className="p-6 text-center text-xs text-slate-500">
                {search ? 'Không có kết quả phù hợp.' : 'Chưa có tin nhắn hỗ trợ nào trong mục này.'}
              </p>
            )}
            {visibleConversations.map((conversation) => {
              const isSelected = selectedId === conversation.ConversationID;
              return (
                <button
                  key={conversation.ConversationID}
                  type="button"
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-4 text-left transition duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-white">
                      {conversation.CustomerName}
                    </span>
                    <time className="shrink-0 text-[10px] text-slate-500">
                      {new Date(conversation.LastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                    {conversation.LastSenderRole === 'AI' && (
                      <span className="text-violet-400 font-bold mr-1">🤖 AI:</span>
                    )}
                    {conversation.LastSenderRole === 'Admin' && (
                      <span className="text-blue-400 font-bold mr-1">👨‍💼 Admin:</span>
                    )}
                    {conversation.LastMessage || 'Chưa có tin nhắn'}
                  </p>
                  {conversation.AssignedAdminName && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                      <span>👤 Phụ trách:</span>
                      <span className="bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 truncate max-w-[150px]">
                        {conversation.AssignedAdminName}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-400 truncate max-w-[180px]">
                      {conversation.CustomerEmail || 'Khách vãng lai'}
                    </span>
                    {conversation.UserID && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        #{conversation.UserID}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="shrink-0 border-t border-slate-800 px-3.5 py-2.5 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
            <span>Trang <strong className="text-white">{currentPage}</strong> / {Math.max(1, Math.ceil(filteredConversations.length / 20))} <span className="text-slate-500">({filteredConversations.length})</span></span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition active:scale-95"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(Math.ceil(filteredConversations.length / 20) || 1, p + 1))}
                disabled={currentPage >= Math.ceil(filteredConversations.length / 20)}
                className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition active:scale-95"
              >
                Tiếp
              </button>
            </div>
          </div>
        </aside>

        {/* Right Side: Message Stream */}
        <section className="flex min-h-0 flex-col bg-slate-950/40">
          {activeConversation ? (
            <>
              {/* Header */}
              <header className="border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-base">{activeConversation.CustomerName}</h2>
                    {activeConversation.Status === 'Closed' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-400 border border-slate-700">
                        🔒 Đã đóng phiên hỗ trợ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ● Đang trực tuyến
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeConversation.CustomerEmail || 'Khách vãng lai chưa đăng nhập'} {activeConversation.UserID ? `· ID thành viên: #${activeConversation.UserID}` : ''}
                    {activeConversation.AssignedAdminName && (
                      <span className="text-cyan-300 ml-2 font-semibold">
                        · Admin xử lý: <strong className="text-white underline">{activeConversation.AssignedAdminName}</strong>
                      </span>
                    )}
                  </p>
                </div>

                {activeConversation.Status !== 'Closed' && (
                  <button
                    type="button"
                    disabled={askingClose}
                    onClick={handleAskClose}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <span>❓ Hỏi khách đóng đoạn chat</span>
                  </button>
                )}
              </header>

              {/* Chat messages */}
              <div ref={messagesPane} className="flex-1 space-y-3.5 overflow-y-auto p-6 scrollbar-thin">
                {messages.map((item) => {
                  const isAdmin = item.SenderRole === 'Admin';
                  const isAI = item.SenderRole === 'AI';

                  return (
                    <div
                      key={item.MessageID}
                      className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-lg ${
                        isAdmin
                          ? 'ml-auto bg-blue-600 text-white shadow-blue-900/30'
                          : isAI
                          ? 'border border-violet-500/20 bg-slate-900 text-slate-100'
                          : 'bg-slate-800/90 text-slate-100 border border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className={`text-[11px] font-bold ${
                          isAdmin ? 'text-blue-100' : isAI ? 'text-violet-400' : 'text-emerald-400'
                        }`}>
                          {isAdmin ? (item.SenderName || 'Quản trị viên') : isAI ? '🤖 Trợ lý DEVORA AI' : item.SenderName || 'Khách hàng'}
                        </span>
                        <time className="text-[10px] opacity-60">
                          {new Date(item.CreatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.Message}</p>
                    </div>
                  );
                })}
                {!messages.length && (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Chưa có tin nhắn trong hội thoại này. Bạn có thể gửi lời chào đến khách hàng.
                  </div>
                )}
              </div>

              {/* Chat Input */}
              {isLockedByOtherAdmin ? (
                <div className="p-4 border-t border-slate-800 bg-amber-950/20 text-center text-xs font-bold text-amber-300">
                  🔒 Cuộc trò chuyện này đang được xử lý bởi admin: <strong>{activeConversation?.AssignedAdminName}</strong>. Bạn chỉ có quyền xem, không thể gửi tin nhắn.
                </div>
              ) : isChatClosed ? (
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 text-center text-xs font-bold text-slate-400">
                  🔒 Phiên hỗ trợ này đã được đóng hoàn tất.
                </div>
              ) : (
                <form onSubmit={send} className="flex gap-3 border-t border-slate-800 p-4 bg-slate-900/60">
                  <textarea
                    aria-label="Nội dung phản hồi"
                    rows={2}
                    maxLength={2000}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send(e);
                      }
                    }}
                    placeholder="Nhập câu trả lời cho khách hàng (Nhấn Enter để gửi, Shift+Enter để xuống dòng)..."
                    className="min-w-0 flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="self-end rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
                  >
                    {sending ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-sm text-slate-500">
              Chọn một hội thoại ở danh sách bên trái để xem nội dung và phản hồi.
            </div>
          )}
        </section>
      </div>

      {/* Modal Nhập Tên Admin Tiếp Nhận Hội Thoại */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-lg">
                👨‍💼
              </div>
              <div>
                <h3 className="text-base font-black text-white">Tiếp nhận hỗ trợ khách hàng</h3>
                <p className="text-xs text-slate-400">Vui lòng nhập tên của bạn để phản hồi tin nhắn</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="adminNameInput" className="text-xs font-bold text-slate-300">
                Tên hiển thị của quản trị viên:
              </label>
              <input
                id="adminNameInput"
                type="text"
                autoFocus
                value={claimInputName}
                onChange={(e) => setClaimInputName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleClaimConfirm();
                }}
                placeholder="Ví dụ: Admin Nam, Admin Minh..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                ⚠️ Lưu ý: Chỉ 1 người được nhập tên vào cuộc trò chuyện này. Khi tiếp nhận, hội thoại sẽ chuyển sang mục &ldquo;Đã phản hồi&rdquo; và các admin khác chỉ có quyền xem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                disabled={claimLoading}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClaimConfirm}
                disabled={!claimInputName.trim() || claimLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                {claimLoading ? 'Đang nhận...' : 'Xác nhận tiếp nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
