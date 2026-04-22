const BASE_URL = `${import.meta.env.VITE_API_URL}/api/workspace`;

// Get uploaded files for a project
export async function getWorkspaceFiles(projectId, token) {
  if (!projectId) throw new Error("projectId is required");

  const res = await fetch(`${BASE_URL}/${projectId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch files");
  }

  return data;
}

// Upload workspace file
export async function uploadWorkspaceFiles(projectId, formData, token) {
  if (!projectId) throw new Error("projectId is required");
  if (!formData) throw new Error("FormData is required");

  const res = await fetch(`${BASE_URL}/${projectId}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data;
}

// Ask question (RAG + conversation history)
export async function askWorkspace({ projectId, question, messages, activeRepo, token }) {
  if (!projectId) throw new Error("projectId is required");
  if (!question) throw new Error("question is required");

  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      projectId,
      question,
      messages, // full conversation history
      activeRepo,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Ask request failed");
  }

  return data;
}