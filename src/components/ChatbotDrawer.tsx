import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSource } from '../types';
import {
  MessageSquare, Send, X, Sparkles, Globe, Trash2,
  ExternalLink, User, Bot, HelpCircle
} from 'lucide-react';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-initial',
      role: 'model',
      text: 'Halo! Aku Webby AI Tutor untuk siswa SMP. Tanyakan rumus Matematika, IPA Terpadu, Bahasa Indonesia, PR sekolah, atau minta bimbingan materi pelajaran kapan saja!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [role, setRole] = useState<'tutor' | 'examiner' | 'researcher'>('tutor');
  const [useSearch, setUseSearch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          role,
          useSearch,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'model',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: data.sources || [],
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Gagal memproses pesan.');
      }
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: 'Maaf, terjadi kendala saat menghubungkan ke asisten. Silakan coba lagi.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'model',
        text: 'Percakapan telah dibersihkan. Apa yang ingin Anda diskusikan sekarang?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#FBFBF9] border-l border-[#E5E3DD] shadow-2xl flex flex-col z-10">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE8E3]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#191918] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#191918]">Webby AI Tutor</h2>
              <p className="text-[11px] text-[#7A7874]">
                Didukung Gemini · Akses Tanpa Batas & Search Grounding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              title="Bersihkan Percakapan"
              className="p-1.5 text-[#8C8A84] hover:text-[#B43425] hover:bg-[#FDF0EE] rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8C8A84] hover:text-[#191918] hover:bg-[#F2F1ED] rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role & Grounding Bar */}
        <div className="px-5 py-2.5 border-b border-[#EAE8E3] bg-[#F7F6F2] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#7A7874]">Peran AI:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'tutor' | 'examiner' | 'researcher')}
              className="px-2 py-1 bg-white border border-[#DDDCD6] rounded text-xs text-[#191918] font-medium focus:outline-none"
            >
              <option value="tutor">Tutor Sokratik</option>
              <option value="examiner">Penguji Akademik</option>
              <option value="researcher">Asisten Riset</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setUseSearch((p) => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors border ${
              useSearch
                ? 'bg-white border-[#DDDCD6] text-[#191918] font-semibold shadow-3xs'
                : 'border-transparent text-[#7A7874]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#1A73E8]" />
            <span>Search Grounding</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded bg-[#191918] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 shadow-3xs ${
                    isUser
                      ? 'bg-[#191918] text-white'
                      : 'bg-white border border-[#EAE8E3] text-[#191918]'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Web Search Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-[#F0EFEA] space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#7A7874] font-semibold block">
                        Rujukan Google Search:
                      </span>
                      <div className="flex flex-col gap-1">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#1A73E8] hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] text-right tabular-nums ${
                      isUser ? 'text-white/60' : 'text-[#8C8A84]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded bg-[#EAE8E3] text-[#191918] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-xs">
              <div className="w-6 h-6 rounded bg-[#191918] text-white flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 bg-white border border-[#EAE8E3] rounded-xl text-xs text-[#7A7874] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#191918] animate-ping" />
                <span>Menelaah dan menyusun respons...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips for SMP Students */}
        <div className="px-5 py-2 flex flex-wrap gap-1.5 border-t border-[#F0EFEA] bg-[#FBFBF9]">
          <button
            onClick={() => setInput('Bagaimana cara menyelesaikan SPLDV dengan metode eliminasi?')}
            className="text-[11px] px-2.5 py-1 bg-white border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded text-[#4A4946] transition-colors"
          >
            Eliminasi SPLDV
          </button>
          <button
            onClick={() => setInput('Jelaskan bunyi Hukum Pascal dan contoh dongkrak hidrolik di IPA SMP!')}
            className="text-[11px] px-2.5 py-1 bg-white border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded text-[#4A4946] transition-colors"
          >
            Hukum Pascal IPA
          </button>
          <button
            onClick={() => setInput('Apa 3 struktur wajib dalam teks Laporan Hasil Observasi (LHO)?')}
            className="text-[11px] px-2.5 py-1 bg-white border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded text-[#4A4946] transition-colors"
          >
            Struktur Teks LHO
          </button>
          <button
            onClick={() => setInput('Bagaimana logika percabangan if-else pada Scratch?')}
            className="text-[11px] px-2.5 py-1 bg-white border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded text-[#4A4946] transition-colors"
          >
            Logika Scratch
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[#EAE8E3] bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder="Tanyakan konsep, soal ujian, atau materi riset..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#191918]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 text-white bg-[#191918] hover:bg-[#2C2C2A] disabled:opacity-40 rounded-lg transition-colors shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
};
