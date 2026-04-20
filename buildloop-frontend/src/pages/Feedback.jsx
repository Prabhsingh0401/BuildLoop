import { motion } from 'framer-motion';
import { MessageSquare, History } from 'lucide-react';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import FeedbackList from '@/components/feedback/FeedbackList';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Feedback() {
  return (
    <div className="relative h-[calc(100vh-180px)] flex flex-col overflow-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="z-10 w-full max-w-7xl mx-auto flex flex-col h-full px-2">
        {/* Page header */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink">Feedback Ingestion</h1>
              <p className="text-xs text-ink-3">
                Submit, sync, and manage user feedback from multiple sources
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Horizontal Layout */}
        <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-0 pb-4">
          {/* Left Column: Feedback List (Compact) */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-1/2 flex flex-col min-h-0 max-h-[50vh] lg:max-h-full"
          >
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <History className="w-4 h-4 text-ink-3" />
              <h2 className="text-sm font-semibold text-ink">Recent Feedback</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <FeedbackList />
            </div>
          </motion.div>

          {/* Right Column: Add Feedback Form */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-1/2 flex flex-col min-h-0"
          >
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 lg:pr-2 pb-2">
              <FeedbackForm />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
