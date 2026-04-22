import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Clock, Trash2, FileText, MessageSquare, Link2, Hash } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import useProjectStore from '@/store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CARD_BASE = 'bg-white/60 backdrop-blur-xl border border-white/40';

const SlackIconImg = ({ className }) => (
  <img 
    src="/1280px-Slack_icon_2019.svg.png" 
    alt="Slack" 
    className={`${className} object-contain`} 
  />
);

const SOURCE_ICONS = {
  paste: MessageSquare,
  file: FileText,
  url: Link2,
  slack: SlackIconImg,
  reddit: Hash,
};

const SOURCE_COLORS = {
  paste: 'bg-brand/10 text-brand',
  file: 'bg-success/10 text-success',
  url: 'bg-warn/10 text-warn',
  slack: 'bg-purple-500/10 text-purple-500',
  reddit: 'bg-orange-500/10 text-orange-500',
};

export default function FeedbackList() {
  const { activeProjectId } = useProjectStore();
  const { isSignedIn } = useAuth();
  const { feedbacks, isLoading } = useFeedback();

  if (!isSignedIn || !activeProjectId) {
    return (
      <div className={`${CARD_BASE} rounded-2xl p-6 text-center`}>
        <p className="text-sm text-ink-3">Sign in to view feedback</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${CARD_BASE} rounded-2xl p-8 flex items-center justify-center`}>
        <Loader2 className="w-5 h-5 text-brand animate-spin" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className={`${CARD_BASE} rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full`}>
        <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mb-3">
          <MessageSquare className="w-5 h-5 text-ink-3" />
        </div>
        <p className="text-sm font-medium text-ink mb-1">No feedback yet</p>
        <p className="text-xs text-ink-3 max-w-[200px]">
          Submit feedback manually or connect Slack/Reddit to sync automatically
        </p>
      </div>
    );
  }

  return (
    <div className={`${CARD_BASE} rounded-2xl flex flex-col overflow-hidden`} style={{ height: '420px' }}>
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {feedbacks.map((fb, i) => (
            <FeedbackCard key={fb._id} fb={fb} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer count */}
      <div className="px-3 py-2 border-t border-white/30 bg-white/30 backdrop-blur-sm">
        <p className="text-[10px] text-ink-3 text-center">
          {feedbacks.length} feedback item{feedbacks.length !== 1 ? 's' : ''} ingested
        </p>
      </div>
    </div>
  );
}

function FeedbackCard({ fb, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { deleteFeedback, isDeleting } = useFeedback();
  const SourceIcon = SOURCE_ICONS[fb.source] || MessageSquare;
  const sourceColor = SOURCE_COLORS[fb.source] || SOURCE_COLORS.paste;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this feedback?')) {
      try {
        await deleteFeedback(fb._id);
        toast.success('Deleted');
      } catch (error) {
        toast.error(error.message || 'Failed to delete');
      }
    }
  };

  const previewText = fb.rawText?.slice(0, 120) || 'No content';
  const hasMore = fb.rawText?.length > 120;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={`${CARD_BASE} rounded-xl p-4 cursor-pointer hover:bg-white/80 transition-colors group`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2.5">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${sourceColor}`}>
          <SourceIcon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-ink-3">
              {fb.source}
            </span>
            <span className="text-[11px] text-ink-3 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {new Date(fb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-3 hover:text-danger hover:bg-danger/10 transition-all"
          title="Delete"
        >
          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </button>
      </div>

      {/* Content */}
      <p className={`text-sm text-ink leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
        {isExpanded ? fb.rawText : previewText}
        {!isExpanded && hasMore && '...'}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {hasMore && (
          <span className="text-[11px] text-brand font-medium">
            {isExpanded ? 'Show less' : 'Read more'}
          </span>
        )}
        <span className="text-[11px] text-ink-3 font-mono ml-auto">
          {fb.chunks?.length || fb.chunkCount || 0} chunks
        </span>
      </div>
    </motion.div>
  );
}
