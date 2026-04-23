import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, InboxIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import useProjectStore from '@/store/projectStore.js';
import FeatureTable from '@/components/features/FeatureTable.jsx';
import PromoteFeatureModal from '@/components/features/PromoteFeatureModal.jsx';
import apiClient from '@/api/client.js';

async function fetchFeatures(projectId) {
  const { data } = await apiClient.get(`/api/features/${projectId}`);
  return data.features;
}

async function runPrioritization(projectId) {
  const { data } = await apiClient.post('/api/insights/prioritize', { projectId });
  return data;
}

async function promoteFeatureToTask(featureId, assignee) {
  const { data } = await apiClient.post(`/api/features/${featureId}/task`, { assignee });
  return data.task;
}

export default function Features() {
  const { activeProjectId, activeProjectRole } = useProjectStore();
  const isPM = activeProjectRole === 'owner';
  const queryClient = useQueryClient();
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [featureToPromote, setFeatureToPromote] = useState(null);
  const [isPromoting, setIsPromoting] = useState(false);

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
      await promoteFeatureToTask(featureId, assignee);
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
        <div className="flex items-center justify-center h-64">
          <p className="text-danger text-sm">Failed to load features.</p>
        </div>
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
        {features.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mb-4">
              <InboxIcon className="w-5 h-5 text-ink-3" />
            </div>
            <h3 className="text-[15px] font-semibold text-ink">No features yet</h3>
            <p className="text-sm text-ink-3 mt-1 max-w-xs">
              Click <strong>Run Prioritization</strong> to convert your insights into ranked features.
            </p>
          </div>
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
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <div className="z-10 w-full max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
