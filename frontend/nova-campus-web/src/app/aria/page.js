'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PanelLeftOpen, X, Trash2 } from 'lucide-react';

const AI = '/api/ai';

// ── helpers ────────────────────────────────────────────────────────────────
function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function groupConvs(list) {
  const todayStr = new Date().toDateString();
  const weekMs = 7 * 24 * 3600 * 1000;
  const groups = { today: [], week: [], older: [] };
  for (const c of list) {
    const d = new Date(c.updated_at);
    if (d.toDateString() === todayStr) groups.today.push(c);
    else if (Date.now() - d.getTime() < weekMs) groups.week.push(c);
    else groups.older.push(c);
  }
  return groups;
}

// ── sub-components (no hooks) ──────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-2 w-2 rounded-full bg-[var(--color-text-muted)] animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

function Avatar({ initials, size = 9 }) {
  const cls = `h-${size} w-${size} rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white font-bold flex-shrink-0`;
  return <div className={cls} style={{ fontSize: size < 10 ? 11 : 14 }}>{initials}</div>;
}

function ConvItem({ conv, active, onLoad, onDelete, deleteLabel }) {
  return (
    <button
      onClick={() => onLoad(conv)}
      className={`w-full text-left px-4 py-2 text-xs group flex items-center gap-2 transition-colors ${
        active
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          : 'text-[var(--color-text)] hover:bg-[var(--color-border)]/30'
      }`}
    >
      <span className="flex-1 truncate">{conv.title}</span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(conv.id); } }}
        className="p-1.5 -m-1.5 rounded-lg hover:bg-[var(--color-error)]/10 text-[var(--color-error)] transition-colors flex items-center justify-center"
        title={deleteLabel}
      ><Trash2 size={14} /></span>
    </button>
  );
}

function MarkdownContent({ content, streaming }) {
  return (
    <div className="text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1">{children}</h3>,
          code: ({ inline, children }) => inline
            ? <code className="px-1 py-0.5 rounded bg-black/10 text-[0.8em] font-mono">{children}</code>
            : <pre className="p-3 rounded-lg bg-black/10 text-xs font-mono overflow-x-auto my-2 whitespace-pre-wrap"><code>{children}</code></pre>,
          table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
          th: ({ children }) => <th className="border border-current/20 px-2 py-1 font-semibold text-left bg-black/5">{children}</th>,
          td: ({ children }) => <td className="border border-current/20 px-2 py-1">{children}</td>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-current/30 pl-3 my-2 opacity-80">{children}</blockquote>,
          hr: () => <hr className="my-2 border-current/20" />,
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && <span className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle animate-pulse" />}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────
export default function AriaPage() {
  // ALL hooks first — no early returns before this block
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { translate, language } = useLanguage();

  const [convs, setConvs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [convSidebarOpen, setConvSidebarOpen] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const mainRef = useRef(null);
  const [maxInputHeight, setMaxInputHeight] = useState(120);

  // Keep the input's max height at 1/3 of the chat area's height
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const update = () => setMaxInputHeight(Math.max(40, Math.floor(el.clientHeight / 3)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auth guard and redirect to dashboard/assistant
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      logout();
      router.replace('/login');
    } else if (!authLoading && isAuthenticated) {
      router.replace('/dashboard/assistant');
    }
  }, [authLoading, isAuthenticated, router, logout]);

  const { apiFetch } = useApi();

  // Load conversation list
  const refreshConvs = useCallback(async () => {
    try {
      const r = await apiFetch(`${AI}/conversations`);
      if (r.ok) setConvs(await r.json());
    } catch { /* ignore */ }
  }, [apiFetch]);

  useEffect(() => {
    if (isAuthenticated) refreshConvs();
  }, [isAuthenticated, refreshConvs]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Handlers
  const loadConv = async (conv) => {
    try {
      const r = await apiFetch(`${AI}/conversations/${conv.id}`);
      if (!r.ok) return;
      const data = await r.json();
      setActiveId(data.id);
      setMessages(data.messages.map((m) => ({ role: m.role, content: m.content, sources: m.sources || [] })));
      setConvSidebarOpen(false);
    } catch { /* ignore */ }
  };

  const newConv = () => {
    setActiveId(null);
    setMessages([]);
    setConvSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const deleteConv = async (id) => {
    try {
      await apiFetch(`${AI}/conversations/${id}`, { method: 'DELETE' });
      setConvs((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) newConv();
    } catch { /* ignore */ }
  };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
    setSending(true);

    const convId = activeId || uid();
    if (!activeId) setActiveId(convId);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: msg, sources: [] }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', sources: [], streaming: true }]);

    try {
      const r = await apiFetch(`${AI}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversation_id: convId, history, ui_language: language }),
      });

      if (!r.ok || !r.body) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: translate('ariaErrorRetry'), sources: [], streaming: false };
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
          const raw = line.slice(6).trim();
          let evt;
          try { evt = JSON.parse(raw); } catch { continue; }

          if (evt.type === 'meta') {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], sources: evt.sources ?? [] };
              return next;
            });
          } else if (evt.type === 'delta') {
            setMessages((prev) => {
              if (!prev.length) return prev;
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
            refreshConvs();
          } else if (evt.type === 'error') {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: translate('ariaErrorRetry'), sources: [], streaming: false };
              return next;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: translate('ariaErrorContact'), sources: [], streaming: false };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) return; // let Enter insert a newline on touch devices
    e.preventDefault();
    send();
  };

  const onInput = (e) => {
    e.target.style.height = 'auto';
    const next = Math.min(e.target.scrollHeight, maxInputHeight);
    e.target.style.height = next + 'px';
    e.target.style.overflowY = e.target.scrollHeight > maxInputHeight ? 'auto' : 'hidden';
  };

  // Render guard (after all hooks)
  if (authLoading || !isAuthenticated) return null;

  const groups = groupConvs(convs);
  const suggested = [
    translate('ariaSuggested1'),
    translate('ariaSuggested2'),
    translate('ariaSuggested3'),
  ];
  const convGroups = [
    { label: translate('ariaToday'),    items: groups.today },
    { label: translate('ariaThisWeek'), items: groups.week  },
    { label: translate('ariaOlder'),    items: groups.older },
  ];

  const renderConvSidebar = (onClose) => (
    <>
      <div className="p-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {translate('ariaConversations')}
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 -m-1 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30 transition-colors flex items-center justify-center"
              aria-label={translate('ariaClose')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={newConv}
          className="w-full text-left text-xs px-3 py-2 rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5"
        >
          {translate('ariaNewConv')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {convGroups.map(({ label, items }) =>
          items.length > 0 && (
            <div key={label}>
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] px-4 pt-3 pb-1 uppercase tracking-wider">{label}</p>
              {items.map((c) => (
                <ConvItem
                  key={c.id}
                  conv={c}
                  active={activeId === c.id}
                  onLoad={loadConv}
                  onDelete={deleteConv}
                  deleteLabel={translate('ariaDelete')}
                />
              ))}
            </div>
          )
        )}
        {convs.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center px-4 py-8">
            {translate('ariaNoConv')}
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="flex-1 flex h-full min-h-[500px] overflow-hidden">

      {/* ── Sidebar gauche (desktop) ── */}
      <aside className="hidden xl:flex w-60 flex-shrink-0 border-r border-[var(--color-border)] flex-col bg-[var(--color-surface)]">
        {renderConvSidebar(null)}
      </aside>

      {/* ── Sidebar gauche (overlay mobile/tablette) ── */}
      <div className={`xl:hidden fixed inset-0 z-50 flex ${convSidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${convSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setConvSidebarOpen(false)}
        />
        <aside
          className="relative w-72 max-w-[80vw] h-full flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: convSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          {renderConvSidebar(() => setConvSidebarOpen(false))}
        </aside>
      </div>

      {/* ── Zone de chat ── */}
      <main ref={mainRef} className="flex-1 flex flex-col min-w-0 min-h-0">

        {/* Header */}
        <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setConvSidebarOpen(true)}
            className="xl:hidden p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30 transition-colors flex-shrink-0"
            aria-label={translate('ariaConversations')}
          >
            <PanelLeftOpen size={18} />
          </button>
          <Avatar initials="Ar" size={9} />
          <div>
            <p className="font-semibold text-sm text-[var(--color-text)] leading-tight">Assistant IA · Aria</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">NovaCampus Alliance · {user?.role ?? translate('ariaFallbackRole')}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-5 text-center">
              <Avatar initials="Ar" size={16} />
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{translate('ariaWelcomeTitle')}</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm">
                  {translate('ariaWelcomeSubtitle')}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {suggested.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-2 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 min-w-0 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && <Avatar initials="Ar" size={8} />}
                  <div className={`flex flex-col gap-1 max-w-[70%] min-w-0 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      m.role === 'user'
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap break-words'
                        : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-tl-sm'
                    }`}>
                      {m.role === 'user' ? (
                        m.content
                      ) : m.content ? (
                        <MarkdownContent content={m.content} streaming={m.streaming} />
                      ) : m.streaming ? (
                        <TypingDots />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onInput={onInput}
              disabled={sending}
              rows={1}
              placeholder={translate('ariaAskAria')}
              className="flex-1 resize-none overflow-y-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-60"
              style={{ maxHeight: maxInputHeight }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              className="h-10 px-5 flex-shrink-0 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {translate('ariaSend')}
            </button>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 text-center">
            {translate('ariaEnterHint')}
          </p>
        </div>
      </main>

    </div>
  );
}
