import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Loader2, InboxIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useProjectStore from '@/store/projectStore.js';
import FeatureTable from '@/components/features/FeatureTable.jsx';
import PromoteFeatureModal from '@/components/features/PromoteFeatureModal.jsx';
import apiClient from '@/api/client.js';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const CARD_BASE = 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

async function fetchFeatures(projectId, token) {
  const { data } = await apiClient.get(`/api/features/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.features;
}

async function runPrioritization(projectId, token) {
  const { data } = await apiClient.post('/api/insights/prioritize', { projectId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}

async function promoteFeatureToTask(featureId, assignee, token) {
  const { data } = await apiClient.post(`/api/features/${featureId}/task`, { assignee }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.task;
}

function FeaturesContent() {
  const { activeProjectId, activeProjectRole } = useProjectStore();
  const { getToken, isSignedIn } = useAuth();
  const isPM = activeProjectRole === 'owner';
  const queryClient = useQueryClient();
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [featureToPromote, setFeatureToPromote] = useState(null);
  const [isPromoting, setIsPromoting] = useState(false);

  const {
    data: features = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['features', activeProjectId],
    queryFn:  async () => {
      const token = await getToken();
      return fetchFeatures(activeProjectId, token);
    },
    enabled:  !!activeProjectId && !!isSignedIn,
  });

  const handlePrioritize = async () => {
    if (!activeProjectId || isPrioritizing) return;
    setIsPrioritizing(true);
    try {
      const token = await getToken();
      const result = await runPrioritization(activeProjectId, token);
      queryClient.invalidateQueries({ queryKey: ['features', activeProjectId] });
      const count = result?.data?.length ?? 0;
      toast.success(count > 0
        ? `${count} features generated.`
        : 'Prioritization complete.'
      );
    } catch (err) {
      toast.error('Prioritization failed. Make sure you have insights first.');
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handlePromoteClick = (feature) => {
    if (!isPM) return;
    if (feature.isPromoted) {
      toast.info('Already on the Kanban board.');
      return;
    }
    setFeatureToPromote(feature);
  };

  const confirmPromote = async (featureId, assignee) => {
    setIsPromoting(true);
    try {
      const token = await getToken();
      await promoteFeatureToTask(featureId, assignee, token);
      queryClient.invalidateQueries({ queryKey: ['features', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
      toast.success(`Sent to Kanban.`);
      setFeatureToPromote(null);
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.info('Already on the Kanban board.');
        setFeatureToPromote(null);
        return;
      }
      toast.error('Failed to send to Kanban.');
      throw err;
    } finally {
      setIsPromoting(false);
    }
  };

  // Content rendering logic
  const renderContent = () => {
    if (!activeProjectId) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-ink-3 text-sm">No project selected.</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-ink-3" />
          <span className="text-ink-3 text-sm">Loading features…</span>
        </div>
      );
    }

    if (isError) {
      return (
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className={`${CARD_BASE} flex flex-col items-center justify-center gap-4 py-16 px-8 text-center`}
        >
          <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-ink-3" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-ink">Failed to load features</p>
            <p className="text-xs text-ink-3 mt-1 max-w-xs">{error?.message ?? 'Unknown error'}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-white border border-border text-ink hover:border-brand/40 hover:text-brand transition-all"
          >
            <Loader2 className="w-4 h-4" />
            Retry
          </button>
        </motion.div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-ink leading-tight">Features</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Prioritized roadmap based on your feedback insights.
            </p>
          </div>

          {isPM && (
            <button
              onClick={handlePrioritize}
              disabled={isPrioritizing}
              className={`
                flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95
                ${isPrioritizing
                  ? 'bg-ink/10 text-ink-3 cursor-not-allowed'
                  : 'bg-[#1a1d23] hover:bg-black text-white shadow-md shadow-black/10'
                }
              `}
            >
              {isPrioritizing && <Loader2 size={16} className="animate-spin" />}
              {isPrioritizing ? 'Prioritizing…' : 'Run Prioritization'}
            </button>
          )}
        </div>

        {/* Table/Empty Area */}
        {(!features || features.length === 0) ? (
          <motion.div 
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className={`${CARD_BASE} flex flex-col items-center justify-center py-20 px-8 text-center`}
          >
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mb-4">
              <InboxIcon className="w-5 h-5 text-ink-3" />
            </div>
            <h3 className="text-[15px] font-semibold text-ink">No features yet</h3>
            <p className="text-sm text-ink-3 mt-1 max-w-xs">
              Click <strong>Run Prioritization</strong> to convert your insights into ranked features.
            </p>
          </motion.div>
        ) : (
          <FeatureTable
            features={features}
            onPromote={isPM ? handlePromoteClick : null}
            onRowClick={() => {}}
          />
        )}

        <PromoteFeatureModal
          feature={featureToPromote}
          projectId={activeProjectId}
          isOpen={!!featureToPromote}
          onClose={() => setFeatureToPromote(null)}
          onConfirm={confirmPromote}
          isPromoting={isPromoting}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {renderContent()}
    </div>
  );
}

function AuthGuard() {
  return (
    <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-10 px-2 sm:px-4">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className={`${CARD_BASE} max-w-md w-full p-10 text-center flex flex-col items-center gap-6`}
      >
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-ink">Product Roadmap</h2>
          <p className="text-sm text-ink-3 leading-relaxed">
            Please sign in to access your prioritized feature list and product roadmap.
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

export default function Features() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-2 sm:px-4">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <SignedIn>
        <FeaturesContent />
      </SignedIn>
      
      <SignedOut>
        <AuthGuard />
      </SignedOut>
    </div>
  );
}
