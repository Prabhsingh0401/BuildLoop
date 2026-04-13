import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, Bot, Sparkles } from "lucide-react";
import { CitationCard } from "./CitationCard.jsx";

// TypingIndicator
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mr-auto max-w-[80%]">
      <div className="w-7 h-7 rounded-card border border-border bg-surface flex items-center justify-center mt-0.5">
        <Bot size={14} className="text-brand" />
      </div>

      <div className="bg-surface border border-border rounded-card px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
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

// UserBubble
function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] bg-brand text-white rounded-card px-4 py-3 text-sm leading-7 break-words">
        {content}
      </div>
    </div>
  );
}

// AssistantBubble
function AssistantBubble({ content, citations = [] }) {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <div className="w-7 h-7 rounded-card border border-border bg-surface flex items-center justify-center mt-0.5">
        <Bot size={14} className="text-brand" />
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="bg-surface border border-border rounded-card px-4 py-3 text-sm leading-7 text-ink break-words">
          {content.split("\n").map((line, i) =>
            line === "" ? (
              <div key={i} className="h-2" />
            ) : (
              <p key={i}>{line}</p>
            )
          )}
        </div>

        {citations?.length > 0 && (
          <CitationCard citations={citations} />
        )}
      </div>
    </div>
  );
}

// EmptyState 
function EmptyState({ hasFiles }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-card bg-brand-light flex items-center justify-center">
        <Sparkles size={20} className="text-brand" />
      </div>

      <p className="text-sm font-semibold text-ink">
        {hasFiles
          ? "Ask anything about your code"
          : "Upload a file to get started"}
      </p>

      <p className="text-xs text-ink-2 max-w-xs">
        {hasFiles
          ? "Answers are based strictly on your uploaded files."
          : "Upload a .js, .ts, .py file to begin."}
      </p>
    </div>
  );
}

// ChatInterface
export function ChatInterface({
  messages = [],
  onAsk,
  isAsking = false,
  onClear,
  hasFiles = false,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasMessages = messages.length > 0;

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  // Focus input
  useEffect(() => {
    if (!isAsking) inputRef.current?.focus();
  }, [isAsking]);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isAsking) return;

      setInput("");
      try {
        await onAsk(trimmed);
      } catch {}
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
    <div className="flex flex-col bg-surface border border-border rounded-card h-full min-h-[500px] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-brand" />
          <span className="text-sm font-semibold text-ink">
            Codebase Q&A
          </span>

          {hasMessages && (
            <span className="px-2 py-0.5 bg-brand-light text-brand text-[11px] font-semibold rounded-pill">
              {Math.floor(messages.length / 2)} turns
            </span>
          )}
        </div>

        {hasMessages && (
          <button
            onClick={onClear}
            disabled={isAsking}
            className="flex items-center gap-1 text-ink-2 hover:text-ink text-xs px-2 py-1 rounded-input border border-border hover:bg-bg disabled:opacity-50"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 pb-6 flex flex-col gap-5 bg-bg">
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
      <div className="border-t border-border px-4 py-3 bg-surface">
        {!hasFiles && (
          <p className="text-ink-3 text-center mb-2 text-xs">
            Upload a file to enable Q&A
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAsking || !hasFiles}
            placeholder={
              !hasFiles
                ? "Upload files first…"
                : isAsking
                ? "Thinking…"
                : "Ask about your code…"
            }
            rows={1}
            className="flex-1 resize-none border border-border rounded-input px-3 py-2 text-sm text-ink bg-surface placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(
                e.target.scrollHeight,
                120
              )}px`;
            }}
          />

          <button
            type="submit"
            disabled={!canSend}
            className="bg-brand text-white hover:bg-brand-dark rounded-input w-10 h-10 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Send size={15} />
          </button>
        </form>

        {hasFiles && !isAsking && (
          <p className="text-ink-3 mt-1 text-[11px]">
            Shift + Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}