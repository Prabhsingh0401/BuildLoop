import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Users, Quote } from 'lucide-react';

/* ─── Sentiment Badge ────────────────────────────────────────── */
const SENTIMENT_CONFIG = {
  positive: {
    label: 'Positive',
    bg: 'bg-white/40',
    text: 'text-ink-3',
    border: 'border-border',
    Icon: TrendingUp,
  },
  negative: {
    label: 'Negative',
    bg: 'bg-white/40',
    text: 'text-ink-3',
    border: 'border-border',
    Icon: TrendingDown,
  },
  mixed: {
    label: 'Mixed',
    bg: 'bg-white/40',
    text: 'text-ink-3',
    border: 'border-border',
    Icon: Minus,
  },
};

function SentimentBadge({ sentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.mixed;
  const { label, bg, text, border, Icon } = cfg;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

/* ─── Shimmer Skeleton ───────────────────────────────────────── */
export function InsightCardSkeleton({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
    >
      {/* Shimmer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
      />
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="h-4 bg-gray-100/80 rounded-full w-2/3 animate-pulse" />
        <div className="h-6 bg-gray-100/80 rounded-full w-20 animate-pulse" />
      </div>
      <div className="space-y-2 mb-5">
        <div className="h-2.5 bg-gray-100/80 rounded-full w-full animate-pulse" />
        <div className="h-2.5 bg-gray-100/80 rounded-full w-[85%] animate-pulse" />
        <div className="h-2.5 bg-gray-100/80 rounded-full w-[70%] animate-pulse" />
      </div>
      <div className="h-5 bg-gray-100/80 rounded-full w-24 animate-pulse" />
    </motion.div>
  );
}

/* ─── Insight Card ───────────────────────────────────────────── */
export default function InsightCard({ insight, index = 0 }) {
  const {
    clusterLabel,
    sentiment,
    frequency,
    summary,
    representativeQuotes = [],
  } = insight;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-white/60 transition-all duration-300 relative overflow-hidden"
    >
      {/* Hover shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/0 rounded-2xl transition-all duration-500 pointer-events-none" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-[15px] font-semibold text-ink leading-snug line-clamp-2 flex-1">
          {clusterLabel}
        </h3>
        <SentimentBadge sentiment={sentiment} />
      </div>

      {/* Summary */}
      <p className="text-sm text-ink-2 leading-relaxed line-clamp-3 mb-5">
        {summary}
      </p>

      {/* Representative quote */}
      {representativeQuotes.length > 0 && (
        <div className="flex items-start gap-2.5 mb-5 bg-bg/60 rounded-xl px-4 py-3 border border-border/60">
          <Quote className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
          <p className="text-xs text-ink-3 italic line-clamp-2">
            {representativeQuotes[0]}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-ink-3 font-medium">
        <div className="flex items-center gap-1.5 bg-bg/80 px-3 py-1.5 rounded-full border border-border/60">
          <Users className="w-3.5 h-3.5" />
          <span className="tabular-nums">
            <span className="text-ink font-semibold">{frequency}</span>
            {' '}feedback item{frequency !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
