import { useState, useCallback }        from "react";
import { useMutation, useQueryClient }  from "@tanstack/react-query";
import { useAuth }                      from "@clerk/clerk-react";
import { uploadWorkspaceFiles, askWorkspace } from "../api/workspace.api.js";

export function useWorkspace(projectId) {
  const { getToken } = useAuth();
  const queryClient  = useQueryClient();

  // Conversation history 
  const [messages, setMessages] = useState([]);

  // Upload mutation 
  const uploadMutation = useMutation({
    mutationFn: async (files) => {
      const token = await getToken();
      return uploadWorkspaceFiles(projectId, files, token);
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

  const clearHistory = useCallback(() => setMessages([]), []);

  return {
    messages,
    ask,
    upload:      uploadMutation.mutateAsync,
    clearHistory,
    isAsking:    askMutation.isPending,
    isUploading: uploadMutation.isPending,
    askError:    askMutation.error,
    uploadError: uploadMutation.error,
  };
}