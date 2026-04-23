import { motion } from 'framer-motion';
import { MessageSquare, History, Lock } from 'lucide-react';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import FeedbackList from '@/components/feedback/FeedbackList';
import useProjectStore from '@/store/projectStore.js';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Feedback() {
  const { activeProjectRole } = useProjectStore();
  const isPM = activeProjectRole === 'owner';
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* Grid background */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="z-10 w-full max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold text-ink leading-tight">Feedback Ingestion</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Submit, sync, and manage user feedback from multiple sources
            </p>
          </div>
        </motion.div>

        {/* Main Content - Horizontal Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Feedback List */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-1/2 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-ink-3" />
              <h2 className="text-sm font-semibold text-ink">Recent Feedback</h2>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden relative bg-white/60 backdrop-blur-xl border border-white/40">
              <FeedbackList />
            </div>
          </motion.div>

          {/* Right Column: Add Feedback Form (PM only) or read-only notice */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-1/2 flex flex-col mt-9"
          >
            {isPM ? (
              <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6">
                <FeedbackForm />
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]">
                <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">View only</p>
                  <p className="text-xs text-gray-400 mt-0.5">Only the project owner can submit feedback.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
