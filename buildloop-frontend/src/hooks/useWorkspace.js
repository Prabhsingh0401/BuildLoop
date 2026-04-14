import { useState, useCallback }        from "react";
import { useMutation, useQuery, useQueryClient }  from "@tanstack/react-query";
import { useAuth }                      from "@clerk/clerk-react";
import { uploadWorkspaceFiles, askWorkspace, getWorkspaceFiles } from "../api/workspace.api.js";

export function useWorkspace(projectId) {
  const { getToken } = useAuth();
  const queryClient  = useQueryClient();

  // Conversation history 
  const [messages, setMessages] = useState([]);

  // Fetch files query
  const { data: filesData } = useQuery({
    queryKey: ["workspace-files", projectId],
    queryFn: async () => {
      const token = await getToken();
      const res = await getWorkspaceFiles(projectId, token);
      return res.data || [];
    },
    enabled: !!projectId,
  });

  const files = filesData || [];

  // Upload mutation 
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const token = await getToken();
      return uploadWorkspaceFiles(projectId, formData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-files", projectId] });
    },
  });

  // Ask mutation 
  const askMutation = useMutation({
    mutationFn: async ({ question, history }) => {
      const token = await getToken();
      return askWorkspace({ projectId, question, messages: history, token });
    },
  });

  // ask(question)
  const ask = useCallback(
    async (question) => {
      // ✅ Prevent spamming while request is in-flight
      if (askMutation.isPending) return;

      const trimmed = question.trim();
      if (!trimmed) return;

      // ✅ Safer snapshot (avoids subtle stale state issues)
      const historySnapshot = [...messages].map(({ role, content }) => ({
        role,
        content,
      }));

      // Optimistic user message
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

      try {
        const result = await askMutation.mutateAsync({
          question: trimmed,
          history:  historySnapshot,
        });

        setMessages((prev) => [
          ...prev,
          {
            role:      "assistant",
            content:   result.answer,
            citations: result.citations ?? [],
          },
        ]);

        return result;
      } catch (err) {
        setMessages((prev) => prev.slice(0, -1)); // rollback
        throw err;
      }
    },
    [messages, askMutation]
  );

  // upload(formData)
  const upload = useCallback(
    async (formData) => {
      return uploadMutation.mutateAsync(formData);
    },
    [uploadMutation]
  );

  const clearHistory = useCallback(() => setMessages([]), []);

  return {
    messages,
    ask,
    upload,
    clearHistory,
    isAsking:    askMutation.isPending,
    isUploading: uploadMutation.isPending,
    askError:    askMutation.error,
    uploadError: uploadMutation.error,
    files,
  };
}