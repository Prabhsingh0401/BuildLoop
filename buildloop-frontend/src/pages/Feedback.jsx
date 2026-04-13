import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import FeedbackList from '@/components/feedback/FeedbackList';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Feedback() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-5 px-4">

      {/* Grid background — matches Dashboard */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <div className="z-10 w-full max-w-8xl mx-auto space-y-4">

        {/* Page header */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[22px] font-semibold text-ink leading-tight">Submit Feedback</h1>
              <p className="text-sm text-ink-3 mt-0.5">
                Paste or upload raw feedback — it gets chunked, embedded, and turned into insights.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-4">
          
          {/* Left Column: Previous Feedback */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4 overflow-hidden"
          >
             <h2 className="text-xl font-semibold text-ink flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                Previous Feedback
             </h2>
             <FeedbackList />
          </motion.div>

          {/* Right Column: Add Feedback Form */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-24"
          >
            <h2 className="text-xl font-semibold text-ink mb-6 hidden lg:block">
              Add Feedback
            </h2>
            <FeedbackForm />
          </motion.div>

        </div>

      </div>
    </div>
  );
}
