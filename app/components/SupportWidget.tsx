'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api, getStoredUser, type SupportMessage } from '@/lib/api';

const ZALO_URL = process.env.NEXT_PUBLIC_ZALO_URL || 'https://zalo.me/0909680426';
const VISITOR_KEY = 'manb-support-visitor';

function getVisitorKey(channel: 'ai' | 'staff') {
	const storageKey = `${VISITOR_KEY}-${channel}`;
	let key = localStorage.getItem(storageKey);
  if (!key) {
    key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		localStorage.setItem(storageKey, key);
  }
  return key;
}

export default function SupportWidget() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiMode, setAiMode] = useState(false);
	const [conversationIds, setConversationIds] = useState<{ ai: number | null; staff: number | null }>({ ai: null, staff: null });
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
	const messagesPane = useRef<HTMLDivElement>(null);

	const identity = useCallback((channel: 'ai' | 'staff') => {
    const user = getStoredUser();
		return {
      userId: user?.UserID ? Number(user.UserID) : undefined,
			visitorKey: getVisitorKey(channel),
			name: user?.FullName || user?.Username || 'Khách hàng',
			email: user?.Email || undefined,
		};
  }, []);

  useEffect(() => {
    const handleUserChange = () => {
      setConversationIds({ ai: null, staff: null });
    };
    window.addEventListener('user-updated', handleUserChange);
    window.addEventListener('storage', handleUserChange);
    return () => {
      window.removeEventListener('user-updated', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, []);

	const refreshMessages = useCallback(async (id: number, channel: 'ai' | 'staff') => {
    try {
			const owner = identity(channel);
      const result = await api.getSupportMessages(id, owner);
      setMessages(result.messages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải tin nhắn');
    }
	}, [identity]);

	useEffect(() => {
		if (!chatOpen) return;
		const pane = messagesPane.current;
		if (pane) pane.scrollTop = pane.scrollHeight;
	}, [chatOpen, aiMode, messages, loading]);

  const openChat = async (useAi = false) => {
    setChatOpen(true);
    setAiMode(useAi);
    setMenuOpen(false);
    setError('');
		setMessages([]);
		const channel = useAi ? 'ai' : 'staff';
		const existingId = conversationIds[channel];
		if (existingId) {
			setLoading(true);
			try { await refreshMessages(existingId, channel); }
			finally { setLoading(false); }
			return;
		}
    setLoading(true);
    try {
			const result = await api.openSupportConversation(identity(channel));
			const id = result.conversation.ConversationID;
			setConversationIds((current) => ({ ...current, [channel]: id }));
			await refreshMessages(result.conversation.ConversationID, channel);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể kết nối bộ phận hỗ trợ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
		const conversationId = conversationIds[aiMode ? 'ai' : 'staff'];
		if (!chatOpen || !conversationId) return;
		const channel = aiMode ? 'ai' : 'staff';
		const timer = window.setInterval(() => { void refreshMessages(conversationId, channel); }, 3000);
    return () => window.clearInterval(timer);
	}, [chatOpen, conversationIds, aiMode, refreshMessages]);

  const sendText = async (textToSend: string) => {
    const message = textToSend.trim();
    const channel = aiMode ? 'ai' : 'staff';
    const conversationId = conversationIds[channel];
    if (!message || !conversationId || loading) return;
    setLoading(true);
    setError('');
    try {
      const owner = identity(channel);
      const result = await api.sendSupportMessage(conversationId, { ...owner, message });
      setMessages((current) => current.some((item) => item.MessageID === result.message.MessageID) ? current : [...current, result.message]);
      setDraft('');
      if (aiMode) {
        try {
          const answer = await api.requestSupportAiReply(conversationId, owner);
          setMessages((current) => current.some((item) => item.MessageID === answer.message.MessageID) ? current : [...current, answer.message]);
        } catch (aiError) {
          setError(aiError instanceof Error ? aiError.message : 'Trợ lý AI chưa thể trả lời. Bạn có thể chuyển sang nhân viên hỗ trợ.');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gửi tin nhắn thất bại');
    } finally {
      setLoading(false);
    }
  };

  async function send(event: FormEvent) {
    event.preventDefault();
    await sendText(draft);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendText(draft);
    }
  };

  if (pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-[calc(68px+env(safe-area-inset-bottom))] right-3.5 z-40 md:bottom-6 md:right-6 md:z-[60] flex flex-col items-end gap-2.5">
      {chatOpen && (
        <section aria-label="Nhắn tin chăm sóc khách hàng" className="flex h-[min(580px,70vh)] w-[min(390px,calc(100vw-1.75rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-3 text-white shadow-sm">
            <div><h2 className="font-bold text-sm md:text-base">{aiMode ? 'Trợ lý AI MANB' : 'Chăm sóc khách hàng'}</h2><p className="text-[11px] text-blue-100">{aiMode ? 'Tư vấn thông minh theo sản phẩm và tồn kho' : 'Nhân viên sẽ phản hồi trong hội thoại này'}</p></div>
            <button onClick={() => setChatOpen(false)} aria-label="Đóng cửa sổ chat" className="rounded-lg p-1.5 text-xl leading-none hover:bg-white/15 cursor-pointer">×</button>
          </header>
          <div ref={messagesPane} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3.5">
            {!messages.length && !loading && (
              <div className="space-y-2.5">
                <p className="rounded-xl bg-white p-3 text-xs md:text-sm text-slate-700 shadow-sm border border-slate-100 leading-relaxed">
                  {aiMode ? 'Xin chào! Em là Trợ lý AI của MANB SHOP. Em có thể tư vấn chi tiết cấu hình, so sánh máy, báo giá và kiểm tra tồn kho trực tiếp theo nhu cầu của anh/chị.' : 'Xin chào! Bạn cần chúng tôi hỗ trợ gì?'}
                </p>
                {aiMode && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Gợi ý câu hỏi nhanh:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '🎮 Laptop chơi game Valorant / LOL',
                        '💻 Laptop sinh viên / văn phòng mỏng nhẹ',
                        '🎨 Laptop học lập trình & đồ họa',
                        '💰 Tư vấn máy tầm 15 - 20 triệu',
                        '📦 Chính sách bảo hành & ship COD',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendText(prompt)}
                          className="rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 active:scale-95 transition text-left cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {messages.map((item) => (
              <div key={item.MessageID} className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs md:text-sm ${item.SenderRole === 'Customer' ? 'ml-auto bg-blue-600 text-white' : item.SenderRole === 'AI' ? 'border border-violet-100 bg-violet-50 text-slate-800' : 'bg-white text-slate-800 shadow-sm border border-slate-100'}`}>
                {item.SenderRole !== 'Customer' && <p className={`mb-1 text-[11px] font-semibold ${item.SenderRole === 'AI' ? 'text-violet-700' : 'text-blue-700'}`}>{item.SenderName}</p>}
                <p className="whitespace-pre-wrap break-words leading-relaxed">{item.Message}</p>
                <time className={`mt-1 block text-right text-[10px] ${item.SenderRole === 'Customer' ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(item.CreatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            ))}
            {loading && !messages.length && <p className="text-xs md:text-sm text-slate-500 text-center py-4">Đang kết nối…</p>}
            {loading && messages.length > 0 && <p className="text-xs text-violet-600 animate-pulse font-semibold">✨ Trợ lý AI đang soạn câu trả lời...</p>}
            {error && <div role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}{aiMode && <button onClick={() => void openChat(false)} className="mt-2 block font-bold underline cursor-pointer">Chuyển sang nhân viên hỗ trợ</button>}</div>}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-2.5 bg-white">
            <textarea
              aria-label="Tin nhắn"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
              rows={2}
              placeholder="Nhập tin nhắn (Enter để gửi)…"
              className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-1.5 text-xs md:text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !conversationIds[aiMode ? 'ai' : 'staff'] || loading}
              className="self-end rounded-xl bg-blue-600 px-3.5 py-2 text-xs md:text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition active:scale-95 cursor-pointer"
            >
              Gửi
            </button>
          </form>
        </section>
      )}
      {menuOpen && !chatOpen && <div className="w-60 md:w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
        <a href={ZALO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 md:gap-3 rounded-xl p-2.5 md:p-3 hover:bg-blue-50 transition"><span className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-full bg-blue-100 text-base md:text-lg font-black text-blue-700">Z</span><span><b className="block text-xs md:text-sm text-slate-900">Liên hệ qua Zalo</b><small className="text-[11px] text-slate-500">Chat trực tiếp với cửa hàng</small></span></a>
        <button onClick={() => void openChat(true)} className="flex w-full items-center gap-2.5 md:gap-3 rounded-xl p-2.5 md:p-3 text-left hover:bg-blue-50 transition"><span className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-full bg-violet-100 text-base md:text-lg">✨</span><span><b className="block text-xs md:text-sm text-slate-900">AI tư vấn sản phẩm</b><small className="text-[11px] text-slate-500">Tra cứu giá và tồn kho trực tiếp</small></span></button>
        <button onClick={() => void openChat(false)} className="flex w-full items-center gap-2.5 md:gap-3 rounded-xl p-2.5 md:p-3 text-left hover:bg-blue-50 transition"><span className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-full bg-emerald-100 text-base md:text-lg">💬</span><span><b className="block text-xs md:text-sm text-slate-900">Nhắn CSKH</b><small className="text-[11px] text-slate-500">Nhân viên sẽ phản hồi trên web</small></span></button>
      </div>}
      {!chatOpen && <button onClick={() => setMenuOpen((open) => !open)} aria-label="Liên hệ và hỗ trợ" className="flex items-center gap-1.5 md:gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2.5 md:px-5 md:py-3 text-xs md:text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"><span className="text-sm md:text-xl">{menuOpen ? '✕' : '💬'}</span><span>{menuOpen ? 'Đóng' : 'Hỗ trợ'}</span></button>}
    </div>
  );
}
