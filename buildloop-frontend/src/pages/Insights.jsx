import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { 
  Loader2, 
  AlertCircle, 
  InboxIcon,
} from 'lucide-react';
import InsightCard, { InsightCardSkeleton } from '@/components/insights/InsightCard';
import { useInsights } from '@/hooks/useInsights';
import { toast } from 'sonner';

const CARD_BASE =
  'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/* ─── Auth Guard view ────────────────────────────────────────── */
function AuthGuard() {
  return (
    <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-10 px-4">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className={`${CARD_BASE} max-w-md w-full p-10 text-center flex flex-col items-center gap-6`}
      >
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-ink">Private Insights</h2>
          <p className="text-sm text-ink-3 leading-relaxed">
            Please sign in to access your AI insights and feedback analysis.
          </p>
        </div>
        <SignInButton mode="modal">
          <button className="w-full py-3.5 bg-ink hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95">
            Sign in to BuildLoop
          </button>
        </SignInButton>
      </motion.div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────── */
function EmptyState({ onSynthesize, isSynthesizing }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.45 }}
      className={`${CARD_BASE} flex flex-col items-center justify-center gap-4 py-20 px-8 text-center`}
    >
      <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
        <InboxIcon className="w-5 h-5 text-ink-3" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-ink">No insights yet</p>
        <p className="text-sm text-ink-3 mt-1 max-w-xs">
          Run the synthesis pipeline to cluster your feedback into AI-generated insights.
        </p>
      </div>
      <SynthesizeButton onClick={onSynthesize} isLoading={isSynthesizing} />
    </motion.div>
  );
}

/* ─── Synthesize Button ──────────────────────────────────────── */
function SynthesizeButton({ onClick, isLoading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95
        ${isLoading
          ? 'bg-ink/10 text-ink-3 cursor-not-allowed'
          : 'bg-[#1a1d23] hover:bg-black text-white shadow-md shadow-black/10'
        }`}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? 'Analysing feedback…' : 'Update Insights'}
    </button>
  );
}

/* ─── Error State ────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.45 }}
      className={`${CARD_BASE} flex flex-col items-center justify-center gap-4 py-16 px-8 text-center`}
    >
      <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-ink-3" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-ink">Failed to load insights</p>
        <p className="text-xs text-ink-3 mt-1 max-w-xs">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-white border border-border text-ink hover:border-brand/40 hover:text-brand transition-all"
      >
        <Loader2 className="w-4 h-4" />
        Retry
      </button>
    </motion.div>
  );
}

/* ─── Main Content Wrapper ───────────────────────────────────── */
function InsightsContent() {
  const { 
    insights, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    synthesize, 
    isSynthesizing, 
    synthError 
  } = useInsights();

  const handleSynthesize = async () => {
    try {
      await synthesize();
      toast.success('Insights synthesized successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to synthesize insights.');
    }
  };

  return (
    <div className="z-10 w-full max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-ink leading-tight">Insights</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              AI-clustered themes distilled from your feedback.
            </p>
          </div>
        </div>

        {!isLoading && !isError && insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <SynthesizeButton onClick={handleSynthesize} isLoading={isSynthesizing} />
          </motion.div>
        )}
      </motion.div>

      {/* ── Synthesis error banner ── */}
      <AnimatePresence>
        {synthError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-5 py-4 bg-danger/10 border border-danger/30 rounded-2xl"
          >
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <p className="text-sm text-danger">{synthError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content Area ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <InsightCardSkeleton key={i} delay={i * 0.07} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message ?? 'Unknown error'} onRetry={refetch} />
      ) : insights.length === 0 ? (
        <EmptyState onSynthesize={handleSynthesize} isSynthesizing={isSynthesizing} />
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start"
        >
          {insights.map((insight, i) => (
            <InsightCard key={insight._id ?? i} insight={insight} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Main Page Export ───────────────────────────────────────── */
export default function Insights() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <SignedIn>
        <InsightsContent />
      </SignedIn>
      
      <SignedOut>
        <AuthGuard />
      </SignedOut>
    </div>
  );
}
