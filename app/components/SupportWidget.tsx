'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api, getStoredUser, type SupportMessage } from '@/lib/api';

const ZALO_URL = process.env.NEXT_PUBLIC_ZALO_URL || 'https://zalo.me/0909680426';
const VISITOR_KEY = 'manb-support-visitor';

function getVisitorKey(channel: 'ai' | 'staff') {
  const storageKey = `${VISITOR_KEY}-${channel}`;
  let key = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
  if (!key) {
    key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (typeof window !== 'undefined') localStorage.setItem(storageKey, key);
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
  const [showTeaser, setShowTeaser] = useState(true);
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
    setShowTeaser(false);
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
    <div className="fixed bottom-[calc(68px+env(safe-area-inset-bottom))] right-3.5 z-40 md:bottom-6 md:right-6 md:z-[60] flex flex-col items-end gap-3">
      {/* Floating Teaser Speech Bubble (Xuất hiện sinh động chào mời khách) */}
      {!chatOpen && !menuOpen && showTeaser && (
        <div className="support-teaser-bubble relative flex items-center gap-2 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-blue-500/40 text-xs font-semibold backdrop-blur-md max-w-[280px]">
          <span className="text-base animate-bounce">🤖</span>
          <button
            onClick={() => void openChat(true)}
            className="flex-1 text-left cursor-pointer hover:text-blue-300 transition"
          >
            <p className="font-bold text-white text-[12px] leading-tight">Tư vấn Laptop & Báo giá AI</p>
            <p className="text-[10px] text-blue-200">Nhấn để chat ngay 24/7 ✨</p>
          </button>
          <button
            onClick={() => setShowTeaser(false)}
            aria-label="Đóng gợi ý"
            className="w-5 h-5 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-[10px] cursor-pointer"
          >
            ✕
          </button>
          {/* Arrow pointing down */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-r border-b border-blue-500/40 transform rotate-45" />
        </div>
      )}

      {/* Chat Window */}
      {chatOpen && (
        <section aria-label="Nhắn tin chăm sóc khách hàng" className="flex h-[min(580px,70vh)] w-[min(390px,calc(100vw-1.75rem))] flex-col overflow-hidden rounded-3xl border border-blue-500/20 bg-white shadow-2xl animate-fadeIn">
          <header className="flex items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 px-4 py-3.5 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg shadow-inner">
                {aiMode ? '🤖' : '👨‍💼'}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-700 animate-pulse" />
              </div>
              <div>
                <h2 className="font-black text-sm md:text-base leading-tight">{aiMode ? 'Trợ lý MANB AI' : 'Chăm sóc khách hàng'}</h2>
                <p className="text-[11px] text-blue-100 font-medium">{aiMode ? 'Tư vấn thông minh & kiểm tra tồn kho' : 'Nhân viên trực tuyến sẵn sàng hỗ trợ'}</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              aria-label="Đóng cửa sổ chat"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg leading-none transition cursor-pointer"
            >
              ✕
            </button>
          </header>

          <div ref={messagesPane} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 scrollbar-thin">
            {!messages.length && !loading && (
              <div className="space-y-2.5">
                <div className="rounded-2xl bg-white p-3.5 text-xs md:text-sm text-slate-700 shadow-sm border border-slate-100 leading-relaxed">
                  {aiMode ? '👋 Dạ MANB SHOP xin chào quý khách! Em là Trợ lý AI chuyên tư vấn laptop. Em có thể gợi ý cấu hình, so sánh máy, báo giá và kiểm tra tồn kho theo nhu cầu của anh/chị.' : 'Dạ MANB SHOP xin chào! Quý khách cần hỗ trợ đơn hàng hoặc tư vấn sản phẩm gì ạ?'}
                </div>
                {aiMode && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">💡 Gợi ý câu hỏi nhanh:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '🎮 Laptop chơi game Valorant, LOL mượt',
                        '💻 Laptop sinh viên / văn phòng mỏng nhẹ',
                        '🎨 Laptop đồ họa & lập trình màn đẹp',
                        '💰 Tư vấn máy tầm 15 - 20 triệu',
                        '📦 Chính sách bảo hành & giao hàng hỏa tốc',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendText(prompt)}
                          className="rounded-xl border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 shadow-xs hover:border-blue-400 active:scale-95 transition text-left cursor-pointer"
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
              <div key={item.MessageID} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm shadow-xs ${item.SenderRole === 'Customer' ? 'ml-auto bg-blue-600 text-white' : item.SenderRole === 'AI' ? 'border border-violet-100 bg-violet-50 text-slate-800' : 'bg-white text-slate-800 shadow-sm border border-slate-100'}`}>
                {item.SenderRole !== 'Customer' && (
                  <p className={`mb-1 text-[11px] font-bold ${item.SenderRole === 'AI' ? 'text-violet-700' : 'text-blue-700'}`}>
                    {item.SenderRole === 'AI' ? '🤖 Trợ lý MANB AI' : item.SenderName || 'Nhân viên CSKH'}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words leading-relaxed">{item.Message}</p>
                <time className={`mt-1 block text-right text-[10px] ${item.SenderRole === 'Customer' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {new Date(item.CreatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            ))}
            {loading && !messages.length && <p className="text-xs md:text-sm text-slate-500 text-center py-4">Đang kết nối hệ thống…</p>}
            {loading && messages.length > 0 && <p className="text-xs text-violet-600 animate-pulse font-semibold">✨ Trợ lý AI đang tra cứu & soạn câu trả lời...</p>}
            {error && (
              <div role="alert" className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {error}
                {aiMode && (
                  <button onClick={() => void openChat(false)} className="mt-2 block font-bold underline cursor-pointer text-blue-700">
                    Chuyển sang nhân viên hỗ trợ
                  </button>
                )}
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 bg-white">
            <textarea
              aria-label="Tin nhắn"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
              rows={2}
              placeholder="Nhập tin nhắn (Nhấn Enter để gửi)…"
              className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-xs md:text-sm outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !conversationIds[aiMode ? 'ai' : 'staff'] || loading}
              className="self-end rounded-xl bg-blue-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer"
            >
              Gửi
            </button>
          </form>
        </section>
      )}

      {/* Menu Options Popover */}
      {menuOpen && !chatOpen && (
        <div className="w-64 md:w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-2.5 shadow-2xl backdrop-blur-md animate-fadeIn space-y-1">
          <button
            onClick={() => void openChat(true)}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left bg-violet-50/50 hover:bg-violet-100/70 border border-violet-100 transition group cursor-pointer"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-lg text-white shadow-md group-hover:scale-110 transition-transform">
              🤖
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <b className="text-xs md:text-sm text-slate-900 font-bold">AI Tư Vấn 24/7</b>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-violet-600 text-white">PRO</span>
              </div>
              <small className="text-[11px] text-slate-500 line-clamp-1">Tra cứu tồn kho & cấu hình ngay</small>
            </div>
          </button>

          <button
            onClick={() => void openChat(false)}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-blue-50 transition group cursor-pointer"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-lg text-white shadow-md group-hover:scale-110 transition-transform">
              💬
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-xs md:text-sm text-slate-900 font-bold">Nhắn Tin CSKH</b>
              <small className="text-[11px] text-slate-500 line-clamp-1">Gặp nhân viên hỗ trợ trên web</small>
            </div>
          </button>

          <a
            href={ZALO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl p-3 hover:bg-blue-50 transition group"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0068ff] text-base font-black text-white shadow-md group-hover:scale-110 transition-transform">
              Z
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-xs md:text-sm text-slate-900 font-bold">Chat Qua Zalo</b>
              <small className="text-[11px] text-slate-500 line-clamp-1">Tư vấn nhanh qua Zalo Official</small>
            </div>
          </a>
        </div>
      )}

      {/* Main Floating Trigger Button with Radar Wave & Glowing Aura */}
      {!chatOpen && (
        <div className="relative group">
          {/* Pulsing Radar Glow Aura */}
          <span className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 opacity-60 blur-md group-hover:opacity-100 transition animate-pulse pointer-events-none" />

          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Liên hệ và hỗ trợ"
            className="relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 px-4 py-3 md:px-5 md:py-3.5 text-xs md:text-sm font-black text-white shadow-2xl transition-all duration-300 group-hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white/30"
          >
            {/* Online Green Indicator Dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>

            <span className={`text-base md:text-xl transition-transform duration-300 ${menuOpen ? 'rotate-90' : 'support-icon-anim'}`}>
              {menuOpen ? '✕' : '💬'}
            </span>

            <span className="tracking-wide">
              {menuOpen ? 'Đóng' : 'Hỗ trợ'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
