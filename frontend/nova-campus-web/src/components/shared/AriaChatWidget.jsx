'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, Maximize2, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

const AI = '/api/ai';

function uid() {
  return crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1 px-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

function MiniMarkdown({ content, streaming }) {
  return (
    <div className="text-xs leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-3 mb-1.5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-3 mb-1.5 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ inline, children }) => inline
            ? <code className="px-1 py-0.5 rounded bg-black/10 font-mono text-[0.75em]">{children}</code>
            : <pre className="p-2 rounded bg-black/10 text-[0.75em] font-mono overflow-x-auto my-1 whitespace-pre-wrap"><code>{children}</code></pre>,
          h1: ({ children }) => <p className="font-bold mb-1">{children}</p>,
          h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
          h3: ({ children }) => <p className="font-medium mb-1">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && <span className="inline-block w-0.5 h-[0.9em] bg-current ml-0.5 align-middle animate-pulse" />}
    </div>
  );
}

export default function AriaChatWidget() {
  const pathname = usePathname();
  const { translate, language } = useLanguage();
  const { apiFetch } = useApi();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const convIdRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    if (!convIdRef.current) convIdRef.current = uid();

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: msg },
      { role: 'assistant', content: '', streaming: true },
    ]);

    try {
      const r = await apiFetch(`${AI}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversation_id: convIdRef.current,
          history,
          ui_language: language,
        }),
      });

      if (!r.ok || !r.body) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: translate('ariaErrorRetry'), streaming: false };
          return next;
        });
        return;
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let evt;
          try { evt = JSON.parse(line.slice(6).trim()); } catch { continue; }
          if (evt.type === 'delta') {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (!last) return prev;
              next[next.length - 1] = { ...last, content: (last.content ?? '') + evt.text };
              return next;
            });
          } else if (evt.type === 'done') {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], streaming: false };
              return next;
            });
          } else if (evt.type === 'error') {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: translate('ariaErrorRetry'), streaming: false };
              return next;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: translate('ariaErrorContact'), streaming: false };
        return next;
      });
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, apiFetch, language, translate]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Don't render on the full Aria page (it already has the full chat UI)
  if (pathname === '/dashboard/assistant') return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* ── Chat window ── */}
      {open && (
        <div className="w-[360px] flex flex-col rounded-2xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden"
          style={{ height: 460 }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              Ar
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--color-text)] leading-tight">Aria</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">NovaCampus AI</p>
            </div>
            <Link
              href="/dashboard/assistant"
              title={translate('ariaOpenFull')}
              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Maximize2 size={13} />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold">
                  Ar
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {translate('ariaWelcomeSubtitle')}
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5">
                      Ar
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-xl text-xs ${
                    m.role === 'user'
                      ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-tr-sm leading-relaxed whitespace-pre-wrap break-words'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-tl-sm'
                  }`}>
                    {m.role === 'user' ? (
                      m.content
                    ) : m.content ? (
                      <MiniMarkdown content={m.content} streaming={m.streaming} />
                    ) : m.streaming ? (
                      <TypingDots />
                    ) : null}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex-shrink-0 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
              disabled={sending}
              rows={1}
              placeholder={translate('ariaAskAria')}
              className="flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-60"
              style={{ maxHeight: 80 }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating bubble button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 text-sm font-medium"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          Ar
        </div>
        <span>{translate('ariaAskAria')}</span>
      </button>

    </div>
  );
}
