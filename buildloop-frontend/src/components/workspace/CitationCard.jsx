import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function CitationCard({ citations = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!citations.length) return null;

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col gap-3">
      {citations.map((citation, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="bg-surface border border-border rounded-card transition"
          >
            {/* Header (clickable) */}
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-bg rounded-card"
            >
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {citation.fileName || "Unknown file"}
                </p>

                {citation.language && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-brand-light text-brand shrink-0">
                    {citation.language}
                  </span>
                )}
              </div>

              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Content */}
            {isOpen && (
              <div className="px-4 pb-4">
                <div className="bg-bg border border-border rounded-input p-3 overflow-x-auto">
                  <pre className="text-[12px] font-mono text-ink leading-relaxed whitespace-pre-wrap break-words">
                    {citation.excerpt || "No preview available"}
                  </pre>
                </div>

                {typeof citation.score === "number" && (
                  <p className="text-[11px] text-ink-3 mt-2 font-mono">
                    relevance: {(citation.score * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}