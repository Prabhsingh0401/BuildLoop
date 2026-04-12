import { useQuery } from '@tanstack/react-query';
import useProjectStore from '@/store/projectStore.js';
import FeatureTable from '@/components/features/FeatureTable.jsx';
import apiClient from '@/api/client.js';

async function fetchFeatures(projectId) {
  const { data } = await apiClient.get(`/features/${projectId}`);
  return data.features;
}

export default function Features() {
  const { activeProjectId } = useProjectStore();

  const {
    data: features = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['features', activeProjectId],
    queryFn:  () => fetchFeatures(activeProjectId),
    enabled:  !!activeProjectId,
  });

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
          <div
            className="w-8 h-8 rounded-full border-2
                       border-border border-t-brand animate-spin"
          />
          <span className="text-ink-3 text-sm font-semibold">
            Loading features…
          </span>
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
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Features
          </h2>
          <p className="text-sm text-ink-3 mt-0.5">
            Prioritised features generated from insights
          </p>
        </div>
        {/* Feature count badge */}
        {features.length > 0 && (
          <span
            className="text-[11px] font-semibold bg-brand-light
                       text-brand px-3 py-1 rounded-pill"
          >
            {features.length} feature{features.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Feature table */}
      <FeatureTable
        features={features}
        onRowClick={(feature) => {
          // Feature edit drawer — to be wired in future task
          console.log('Feature row clicked:', feature);
        }}
      />

    </div>
  );
}
