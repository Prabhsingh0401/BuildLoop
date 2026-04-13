import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchInsights, synthesizeInsights } from '@/services/insightService';
import useProjectStore from '@/store/projectStore';

export function useInsights() {
  const { activeProjectId } = useProjectStore();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const insightsQuery = useQuery({
    queryKey: ['insights', activeProjectId],
    queryFn: async () => {
      const token = await getToken();
      return fetchInsights(activeProjectId, token);
    },
    enabled: !!activeProjectId && !!isSignedIn,
    select: (res) => res.data || [],
  });

  const synthesizeMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return synthesizeInsights(activeProjectId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights', activeProjectId] });
    },
  });

  return {
    insights: insightsQuery.data || [],
    isLoading: insightsQuery.isLoading,
    isError: insightsQuery.isError,
    error: insightsQuery.error,
    refetch: insightsQuery.refetch,
    synthesize: synthesizeMutation.mutateAsync,
    isSynthesizing: synthesizeMutation.isPending,
    synthError: synthesizeMutation.error?.message || null,
  };
}
