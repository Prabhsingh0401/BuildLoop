import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Clock, Trash2 } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import useProjectStore from '@/store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CARD_BASE = 'bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

export default function FeedbackList() {
  const { activeProjectId } = useProjectStore();
  const { isSignedIn } = useAuth();
  
  const { feedbacks, isLoading } = useFeedback();

  if (!isSignedIn || !activeProjectId) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className={`${CARD_BASE} rounded-2xl p-6 text-center text-gray-500`}>
        No feedback ingested for this project yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-10">
      <AnimatePresence>
        {feedbacks.map((fb, i) => (
          <FeedbackCard key={fb._id} fb={fb} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function FeedbackCard({ fb, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { deleteFeedback, isDeleting } = useFeedback();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteFeedback(fb._id);
        toast.success('Feedback deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete feedback');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className={`${CARD_BASE} rounded-2xl p-5 cursor-pointer hover:bg-white/80 transition-colors active:scale-[0.99]`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-600">
          {fb.source}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs text-gray-400 gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {new Date(fb.createdAt).toLocaleDateString()}
          </div>
          <button 
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="text-gray-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors"
            title="Delete feedback"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      <p className={`text-sm text-ink-2 leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
        {fb.rawText}
      </p>
      
      <div className="mt-4 flex items-center justify-between border-t border-gray-100/50 pt-3">
        <span className="text-xs text-brand font-medium">
          {isExpanded ? 'Show less' : 'Read more'}
        </span>
        <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded-md">
          {fb.chunkCount ?? fb.chunks?.length ?? 0} chunks extracted
        </span>
      </div>
    </motion.div>
  );
}
