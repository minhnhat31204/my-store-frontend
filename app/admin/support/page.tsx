'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { api, getStoredUser, type SupportConversation, type SupportMessage } from '@/lib/api';
import { useAdminGuard } from '@/lib/useAdminGuard';

export default function AdminSupportPage() {
  useAdminGuard();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesPane = useRef<HTMLDivElement>(null);

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
    const timer = window.setInterval(() => void refreshConversations(), 5000);
    return () => window.clearInterval(timer);
  }, [refreshConversations]);

  useEffect(() => {
    setMessages([]);
    if (!selectedId) return;
    void refreshMessages(selectedId);
    const timer = window.setInterval(() => void refreshMessages(selectedId), 3000);
    return () => window.clearInterval(timer);
  }, [selectedId, refreshMessages]);

  useEffect(() => {
    const pane = messagesPane.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [messages, selectedId]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!selectedId || !message || sending) return;
    setSending(true);
    setError('');
    try {
      const user = getStoredUser();
      const result = await api.sendSupportMessage(selectedId, {
        role: 'Admin',
        userId: user?.UserID,
        senderName: user?.FullName || 'Quản trị viên',
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
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.CustomerName || '').toLowerCase().includes(query) ||
      (c.CustomerEmail || '').toLowerCase().includes(query) ||
      (c.LastMessage || '').toLowerCase().includes(query)
    );
  });

  const activeConversation = conversations.find((row) => row.ConversationID === selectedId);

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-10rem)] gap-5 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800/80 shadow-2xl shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-1.5">
            💬 Phân hệ Hỗ trợ Khách hàng Trực tuyến
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Hộp Thư & Tư Vấn Khách Hàng
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
      <div className="grid min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl md:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left Side: Conversations List */}
        <aside className="flex min-h-0 flex-col border-b border-slate-800 md:border-b-0 md:border-r">
          <div className="p-3.5 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-white text-xs uppercase tracking-wider">
                Hội thoại ({conversations.length})
              </h2>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
            {!filteredConversations.length && (
              <p className="p-6 text-center text-xs text-slate-500">
                {search ? 'Không có kết quả phù hợp.' : 'Chưa có tin nhắn hỗ trợ nào.'}
              </p>
            )}
            {filteredConversations.map((conversation) => {
              const isSelected = selectedId === conversation.ConversationID;
              return (
                <button
                  key={conversation.ConversationID}
                  onClick={() => setSelectedId(conversation.ConversationID)}
                  className={`w-full p-4 text-left transition duration-200 ${
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
                      <span className="text-blue-400 font-bold mr-1">👨‍💼 Bạn:</span>
                    )}
                    {conversation.LastMessage || 'Chưa có tin nhắn'}
                  </p>
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
        </aside>

        {/* Right Side: Message Stream */}
        <section className="flex min-h-0 flex-col bg-slate-950/40">
          {activeConversation ? (
            <>
              {/* Header */}
              <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/60">
                <div>
                  <h2 className="font-bold text-white text-base">{activeConversation.CustomerName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeConversation.CustomerEmail || 'Khách vãng lai chưa đăng nhập'} {activeConversation.UserID ? `· ID thành viên: #${activeConversation.UserID}` : ''}
                  </p>
                </div>
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
                          {isAdmin ? 'Quản trị viên (Bạn)' : isAI ? '🤖 Trợ lý MANB AI' : item.SenderName || 'Khách hàng'}
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
                  className="self-end rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-lg shadow-blue-600/30 active:scale-95"
                >
                  {sending ? 'Đang gửi...' : 'Gửi'}
                </button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-sm text-slate-500">
              Chọn một hội thoại ở danh sách bên trái để xem nội dung và phản hồi.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
