import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Sparkles, InboxIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import useProjectStore from '@/store/projectStore.js';
import FeatureTable from '@/components/features/FeatureTable.jsx';
import apiClient from '@/api/client.js';

async function fetchFeatures(projectId) {
  const { data } = await apiClient.get(`/api/features/${projectId}`);
  return data.features;
}

async function runPrioritization(projectId) {
  const { data } = await apiClient.post('/api/insights/prioritize', { projectId });
  return data;
}

async function promoteFeatureToTask(featureId) {
  const { data } = await apiClient.post(`/api/features/${featureId}/task`);
  return data.task;
}

export default function Features() {
  const { activeProjectId } = useProjectStore();
  const queryClient = useQueryClient();
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const {
    data: features = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['features', activeProjectId],
    queryFn:  () => fetchFeatures(activeProjectId),
    enabled:  !!activeProjectId,
  });

  const handlePrioritize = async () => {
    if (!activeProjectId || isPrioritizing) return;
    setIsPrioritizing(true);
    try {
      const result = await runPrioritization(activeProjectId);
      queryClient.invalidateQueries({ queryKey: ['features', activeProjectId] });
      const count = result?.data?.length ?? 0;
      toast.success(count > 0
        ? `${count} feature${count !== 1 ? 's' : ''} generated from insights.`
        : 'Prioritization complete.'
      );
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Prioritization failed. Make sure you have synthesized insights first.';
      toast.error(message);
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handlePromote = async (feature) => {
    try {
      await promoteFeatureToTask(feature._id);
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
      toast.success(`"${feature.title}" added to Kanban board.`);
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.info('This feature already has a task on the Kanban board.');
        return;
      }
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to add feature to Kanban.';
      toast.error(message);
      throw err;
    }
  };

  // No project selected
  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-ink-3 text-sm">
          No project selected. Select a project to view features.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-brand animate-spin" />
          <span className="text-ink-3 text-sm font-semibold">Loading features…</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-danger text-sm">
          Failed to load features. Check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <div className="z-10 w-full max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-ink leading-tight">Features</h1>
            <p className="text-sm text-ink-3 mt-0.5">
              AI-prioritised features from insights — send them to the Kanban board as tasks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {features.length > 0 && (
              <span className="text-[11px] font-semibold bg-brand-light text-brand px-3 py-1 rounded-pill">
                {features.length} feature{features.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={handlePrioritize}
              disabled={isPrioritizing}
              className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95
                ${isPrioritizing
                  ? 'bg-ink/10 text-ink-3 cursor-not-allowed'
                  : 'bg-[#1a1d23] hover:bg-black text-white shadow-md shadow-black/10'
                }`}
            >
              {isPrioritizing && <Loader2 size={14} className="animate-spin" />}
              {isPrioritizing ? 'Prioritising…' : 'Run Prioritization'}
            </button>
          </div>
        </div>

        {/* Empty state */}
        {features.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center gap-4 py-20 text-center
                       bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl
                       shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
              <InboxIcon className="w-5 h-5 text-ink-3" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">No features yet</p>
              <p className="text-sm text-ink-3 mt-1 max-w-xs">
                Click <strong>Run Prioritization</strong> to convert your synthesized insights into ranked features.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Feature table */
          <FeatureTable
            features={features}
            onPromote={handlePromote}
            onRowClick={() => {}}
          />
        )}
      </div>
    </div>
  );
}
