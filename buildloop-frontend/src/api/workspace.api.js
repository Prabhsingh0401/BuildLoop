const BASE_URL = `${import.meta.env.VITE_API_URL}/api/workspace`;

// Upload workspace file
export async function uploadWorkspaceFiles(projectId, files, token) {
  if (!projectId) throw new Error("projectId is required");
  if (!files || files.length === 0) throw new Error("No files provided");

  const formData = new FormData();
  formData.append("file", files[0]); // backend expects "file"

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
export async function askWorkspace({ projectId, question, messages, token }) {
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
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Ask request failed");
  }

  return data;
}


// Get uploaded files (used by left panel)
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
    throw new Error(data.message || "Failed to fetch workspace files");
  }

  return data.data || [];
}