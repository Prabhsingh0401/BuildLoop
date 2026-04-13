export function CitationCard({ citations = [] }) {
  if (!citations.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {citations.map((citation, index) => (
        <div
          key={index}
          className="bg-surface border border-border rounded-card p-4 transition hover:bg-bg"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-sm font-semibold text-ink truncate">
              {citation.fileName || "Unknown file"}
            </p>

            {citation.language && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-brand-light text-brand shrink-0">
                {citation.language}
              </span>
            )}
          </div>

          {/* Code Block */}
          <div className="bg-bg border border-border rounded-input p-3 overflow-x-auto">
            <pre className="text-[12px] font-mono text-ink leading-relaxed whitespace-pre-wrap break-words">
              {citation.excerpt || "No preview available"}
            </pre>
          </div>

          {/* Footer */}
          {typeof citation.score === "number" && (
            <p className="text-[11px] text-ink-3 mt-2 font-mono">
              relevance: {(citation.score * 100).toFixed(1)}%
            </p>
          )}
        </div>
      ))}
    </div>
  );
}