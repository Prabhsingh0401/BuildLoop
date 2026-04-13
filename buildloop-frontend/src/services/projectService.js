const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const fetchProjects = async (token) => {
  const res = await fetch(`${API_BASE}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to fetch projects: ${errorBody}`);
  }
  return res.json();
};

export const createProject = async (name, description, token) => {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to create project: ${errorBody}`);
  }
  return res.json();
};
