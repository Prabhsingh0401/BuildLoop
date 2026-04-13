const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

/**
 * Submit raw feedback text to the backend ingestion pipeline.
 * @param {{ rawText: string, projectId: string, source?: string, metaType?: string }} payload
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, data: { chunkCount: number, feedbackId: string } }>}
 */
export async function submitFeedback(payload, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to submit feedback.');
  }

  return json;
}

export async function fetchProjectFeedback(projectId, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/feedback/${projectId}`, {
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to fetch feedback.');
  }

  return json;
}

export async function deleteFeedback(feedbackId, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/feedback/${feedbackId}`, {
    method: 'DELETE',
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to delete feedback.');
  }

  return json;
}
