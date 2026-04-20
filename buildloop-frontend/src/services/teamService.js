const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

/**
 * Fetch all team members for a specific project.
 * Only returns members added by the calling PM.
 */
export const fetchTeamMembers = async (projectId, token) => {
  const res = await fetch(
    `${API_BASE}/api/team-members?projectId=${encodeURIComponent(projectId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch team members: ${body}`);
  }
  return res.json();
};

/**
 * Add a new member to a specific project.
 * Body: { email, role, name, projectId }
 */
export const addTeamMember = async ({ email, role, name, projectId }, token) => {
  const res = await fetch(`${API_BASE}/api/team-members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, role, name, projectId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to add team member');
  }
  return res.json();
};

/** Update a team member's role or name. */
export const updateTeamMember = async (id, { role, name }, token) => {
  const res = await fetch(`${API_BASE}/api/team-members/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to update team member');
  }
  return res.json();
};

/** Remove a team member from a project. */
export const deleteTeamMember = async (id, token) => {
  const res = await fetch(`${API_BASE}/api/team-members/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to remove team member');
  }
  return res.json();
};
