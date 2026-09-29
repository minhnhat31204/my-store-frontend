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
  const messagesPane = useRef<HTMLDivElement>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const rows = await api.getSupportConversations();
      setConversations(rows);
      setSelectedId((current) => current && rows.some((row) => row.ConversationID === current) ? current : (rows[0]?.ConversationID ?? null));
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải hộp thư'); }
  }, []);

  const refreshMessages = useCallback(async (id: number) => {
    try {
      const result = await api.getSupportMessages(id, { role: 'Admin' });
      setMessages(result.messages || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải nội dung hội thoại'); }
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
      const result = await api.sendSupportMessage(selectedId, { role: 'Admin', userId: user?.UserID, senderName: user?.FullName || 'Quản trị viên', message });
      setMessages((current) => [...current, result.message]);
      setDraft('');
      void refreshConversations();
    } catch (e) { setError(e instanceof Error ? e.message : 'Gửi phản hồi thất bại'); }
    finally { setSending(false); }
  }

  const activeConversation = conversations.find((row) => row.ConversationID === selectedId);

  return <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-7xl flex-col gap-5 text-slate-100">
    <div><h1 className="text-2xl font-black">Hỗ trợ khách hàng</h1><p className="mt-1 text-sm text-slate-400">Trao đổi trực tiếp với khách hàng. Danh sách và tin nhắn tự làm mới.</p></div>
    {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
    <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-slate-800 md:border-b-0 md:border-r">
        <div className="border-b border-slate-800 px-4 py-3"><h2 className="font-bold">Hội thoại <span className="ml-1 rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-300">{conversations.length}</span></h2></div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!conversations.length && <p className="p-5 text-sm text-slate-400">Chưa có tin nhắn hỗ trợ.</p>}
          {conversations.map((conversation) => <button key={conversation.ConversationID} onClick={() => setSelectedId(conversation.ConversationID)} className={`w-full border-b border-slate-800/70 p-4 text-left transition ${selectedId === conversation.ConversationID ? 'bg-blue-600/15' : 'hover:bg-slate-900'}`}>
            <span className="flex items-center justify-between gap-2"><b className="truncate text-sm text-white">{conversation.CustomerName}</b><time className="shrink-0 text-[10px] text-slate-500">{new Date(conversation.LastMessageAt).toLocaleDateString('vi-VN')}</time></span>
            <span className="mt-1 block truncate text-xs text-slate-400">{conversation.LastSenderRole === 'AI' && <b className="text-violet-300">AI · </b>}{conversation.LastMessage || 'Chưa có tin nhắn'}</span>
            <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-blue-400">{conversation.CustomerEmail || (conversation.UserID ? `Tài khoản #${conversation.UserID}` : 'Khách vãng lai')}</span>
          </button>)}
        </div>
      </aside>
      <section className="flex min-h-0 flex-col">
        {activeConversation ? <>
          <header className="border-b border-slate-800 px-5 py-3"><h2 className="font-bold text-white">{activeConversation.CustomerName}</h2><p className="text-xs text-slate-400">{activeConversation.CustomerEmail || 'Khách hàng'}</p></header>
          <div ref={messagesPane} className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.map((item) => <div key={item.MessageID} className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${item.SenderRole === 'Admin' ? 'ml-auto bg-blue-600 text-white' : item.SenderRole === 'AI' ? 'border border-violet-500/20 bg-violet-950/30 text-slate-100' : 'bg-slate-800 text-slate-100'}`}>
              <p className={`mb-1 text-[11px] font-semibold ${item.SenderRole === 'Admin' ? 'text-blue-100' : item.SenderRole === 'AI' ? 'text-violet-300' : 'text-emerald-300'}`}>{item.SenderName}</p>
              <p className="whitespace-pre-wrap break-words text-sm">{item.Message}</p>
              <time className="mt-1 block text-right text-[10px] opacity-60">{new Date(item.CreatedAt).toLocaleString('vi-VN')}</time>
            </div>)}
            {!messages.length && <p className="text-sm text-slate-500">Chưa có tin nhắn. Bạn có thể chủ động chào khách.</p>}
          </div>
          <form onSubmit={send} className="flex gap-3 border-t border-slate-800 p-4">
            <textarea aria-label="Nội dung phản hồi" rows={2} maxLength={2000} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nhập phản hồi cho khách…" className="min-w-0 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <button disabled={!draft.trim() || sending} className="self-end rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">Gửi</button>
          </form>
        </> : <div className="grid flex-1 place-items-center p-6 text-sm text-slate-500">Chọn một hội thoại để xem và trả lời.</div>}
      </section>
    </div>
  </div>;
}
