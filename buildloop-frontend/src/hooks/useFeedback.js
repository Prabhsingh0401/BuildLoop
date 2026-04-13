import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchProjectFeedback, submitFeedback, deleteFeedback } from '@/services/feedbackService';
import useProjectStore from '@/store/projectStore';

export function useFeedback() {
  const { activeProjectId } = useProjectStore();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const feedbackQuery = useQuery({
    queryKey: ['feedbacks', activeProjectId],
    queryFn: async () => {
      const token = await getToken();
      return fetchProjectFeedback(activeProjectId, token);
    },
    enabled: !!activeProjectId && !!isSignedIn,
    select: (res) => res.data || [],
  });

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      return submitFeedback({ ...payload, projectId: activeProjectId }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', activeProjectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (feedbackId) => {
      const token = await getToken();
      return deleteFeedback(feedbackId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', activeProjectId] });
    },
  });

  return {
    feedbacks: feedbackQuery.data || [],
    isLoading: feedbackQuery.isLoading,
    isError: feedbackQuery.isError,
    submitFeedback: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error?.message || null,
    deleteFeedback: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
