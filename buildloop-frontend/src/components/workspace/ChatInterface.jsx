import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, Bot, MessageSquare, Database } from "lucide-react";
import { CitationCard } from "./CitationCard.jsx";

const BUTTON_BASE =
  "backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 mr-auto max-w-[90%]">
      <div className="w-5 h-5 rounded-input border border-border bg-surface flex items-center justify-center mt-0.5 shrink-0">
        <Bot size={11} className="text-ink-3" />
      </div>
      <div className="bg-surface border border-border rounded-card px-3 py-2.5">
        <div className="flex gap-1.5 items-center h-3.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── User Bubble ───────────────────────────────────────────────────
function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-ink text-white rounded-card px-3 py-2.5 text-[13px] leading-6 break-words whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

// ── Assistant Bubble ──────────────────────────────────────────────
function AssistantBubble({ content, citations = [] }) {
  const safeContent = content ?? "";
  return (
    <div className="flex items-start gap-2 max-w-[90%]">
      <div className="w-5 h-5 rounded-input border border-border bg-surface flex items-center justify-center mt-0.5 shrink-0">
        <Bot size={11} className="text-ink-3" />
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="bg-surface border border-border rounded-card px-3 py-2.5 text-[13px] leading-6 text-ink break-words overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-base font-semibold mt-2 mb-1" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-[14px] font-semibold mt-2 mb-1" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-[13px] font-semibold mt-2 mb-1" {...props} />,
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />,
              a: ({node, ...props}) => <a className="text-brand hover:underline" {...props} />,
              code: ({node, inline, ...props}) => 
                inline ? (
                  <code className="bg-bg border border-border rounded px-1 py-0.5 font-mono text-[11px]" {...props} />
                ) : (
                  <pre className="bg-bg border border-border rounded p-2 overflow-x-auto my-2 text-[11px] font-mono">
                    <code {...props} />
                  </pre>
                ),
              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-brand pl-3 italic text-ink-3 my-2" {...props} />
            }}
          >
            {safeContent}
          </ReactMarkdown>
        </div>

        {citations?.length > 0 && <CitationCard citations={citations} />}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ hasFiles }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="w-9 h-9 rounded-card border border-border bg-surface flex items-center justify-center">
        <MessageSquare size={16} className="text-ink-3" />
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">
          {hasFiles ? "Ask anything about your code" : "No repository synced"}
        </p>
        <p className="text-xs text-ink-3 mt-1 max-w-[180px] leading-relaxed">
          {hasFiles
            ? "Answers are grounded in your synced repository files."
            : "Sync a repository from the left panel to enable Q&A."}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export function ChatInterface({
  messages = [],
  onAsk,
  isAsking = false,
  onClear,
  hasFiles = false,
  activeRepo = null,
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasMessages = messages.length > 0;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  // Keep input focused
  useEffect(() => {
    if (!isAsking) inputRef.current?.focus();
  }, [isAsking]);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isAsking) return;
      setInput("");
      setError(null);
      try {
        await onAsk(trimmed);
      } catch (err) {
        setError(err.message || "Something went wrong");
      }
    },
    [input, isAsking, onAsk]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const canSend = input.trim().length > 0 && !isAsking && hasFiles;

  return (
    <div className="flex flex-col bg-surface border border-border rounded-card h-full overflow-hidden">

      {/* Header — two rows to gracefully handle long repo names */}
      <div className="px-4 py-2.5 border-b border-border shrink-0">
        {/* Row 1: title + turns badge + clear button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-ink shrink-0">
              Codebase Q&amp;A
            </span>
            {hasMessages && (
              <span className="px-1.5 py-0.5 bg-bg border border-border text-ink-3 text-[10px] font-semibold rounded-pill shrink-0">
                {Math.floor(messages.length / 2)} turns
              </span>
            )}
          </div>

          {hasMessages && (
            <button
              onClick={onClear}
              disabled={isAsking}
              className={`flex items-center gap-1 text-ink-3 hover:text-ink text-[11px] px-2 py-0.5 rounded-input border border-border hover:bg-bg shrink-0 ml-2 ${BUTTON_BASE}`}
            >
              <RotateCcw size={10} />
              Clear
            </button>
          )}
        </div>

        {/* Row 2: active repo pill — truncated so it never overflows */}
        {activeRepo && (
          <div className="mt-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 border border-brand/20 text-brand text-[10px] font-semibold rounded-pill max-w-full overflow-hidden">
              <Database size={8} className="shrink-0" />
              <span className="truncate">{activeRepo}</span>
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-bg">
        {!hasMessages ? (
          <EmptyState hasFiles={hasFiles} />
        ) : (
          <>
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <UserBubble key={i} content={msg.content} />
              ) : (
                <AssistantBubble
                  key={i}
                  content={msg.content}
                  citations={msg.citations}
                />
              )
            )}
            {isAsking && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2.5 bg-surface shrink-0">
        {!hasFiles && (
          <p className="text-ink-3 text-center mb-2 text-xs">
            Sync a repository to enable Q&amp;A
          </p>
        )}

        {error && (
          <p className="text-danger text-xs mb-2 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isAsking || !hasFiles}
            placeholder={
              !hasFiles
                ? "Sync a repository first…"
                : isAsking
                ? "Thinking…"
                : "Ask about your code…"
            }
            rows={1}
            className="flex-1 resize-none border border-border rounded-input px-3 py-2 text-[13px] text-ink bg-bg placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50"
            style={{ maxHeight: "100px", overflowY: "hidden" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
            }}
          />

          <button
            type="submit"
            disabled={!canSend}
            className={`bg-ink text-white hover:bg-black rounded-input w-8 h-8 flex items-center justify-center shrink-0 ${BUTTON_BASE}`}
          >
            <Send size={13} />
          </button>
        </form>

        {hasFiles && !isAsking && (
          <p className="text-ink-3 mt-1 text-[10px]">↵ send · Shift+↵ new line</p>
        )}
      </div>
    </div>
  );
}