const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

/**
 * Fetch all insights for a project.
 * @param {string} projectId
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, data: import('../types/insight').InsightDocument[] }>}
 */
export async function fetchInsights(projectId, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/insights/${projectId}`, {
    headers
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Failed to fetch insights.');
  }

  return json;
}

/**
 * Trigger the insight synthesis pipeline on all stored feedback for a project.
 * @param {string} projectId
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, data: unknown }>}
 */
export async function synthesizeInsights(projectId, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/insights/synthesize`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? 'Synthesis failed.');
  }

  return json;
}

/**
 * Trigger the prioritization pipeline on synthesized insights for a project.
 * @param {string} projectId
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, data: unknown }>}
 */
export async function prioritizeProjectInsights(projectId, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/insights/prioritize`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ projectId }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? 'Prioritization failed.');
  }

  return json;
}
