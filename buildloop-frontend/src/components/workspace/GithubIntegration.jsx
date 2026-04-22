import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client.js';
import {
  Loader2, RefreshCw, LogOut, ChevronRight,
  FileCode, GitCommit, GitPullRequest, Database, CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileTree from './FileTree';

function timeAgo(date) {
  if (!date) return null;
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const GithubIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const decodeBase64 = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    try { return atob(str); } catch { return 'Error decoding file content.'; }
  }
};

const BUTTON_BASE =
  'backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export default function GithubIntegration({ projectId, onRepoSelect }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const hasProcessed = useRef(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [activeTab, setActiveTab] = useState('files');
  const [selectedFile, setSelectedFile] = useState(null);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async ({ code, projectId: pid, userId: uid }) => {
      const targetProjectId = pid || projectId;
      const r = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/integrations/github/callback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, projectId: targetProjectId, userId: uid })
        }
      );
      const json = await r.json();
      if (!r.ok || !json.success) throw new Error(json.message || 'GitHub connect failed');
      return json;
    },
    onSuccess: () => {
      // Hard redirect to the clean URL — removes ?code= and forces the
      // status query to re-run from scratch so the connected state loads.
      window.location.replace(window.location.pathname);
    }
  });

  // Handle OAuth callback on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && !hasProcessed.current) {
      hasProcessed.current = true;
      let callbackProjectId = projectId;
      let callbackUserId = user?.id;
      try {
        if (state) {
          const parsed = JSON.parse(atob(state));
          if (parsed.projectId) callbackProjectId = parsed.projectId;
          if (parsed.userId) callbackUserId = parsed.userId;
        }
      } catch {
        // state was not set by us — ignore
      }
      connectMutation.mutate({ code, projectId: callbackProjectId, userId: callbackUserId });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch status — use `status` not `isLoading` so background refetches
  // don't re-show the spinner after the initial load.
  const { data: statusData, status: statusQueryStatus } = useQuery({
    queryKey: ['githubStatus', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/integrations/github/${projectId}`);
      return data.data;
    },
    enabled: !!projectId
  });

  const isConnected = !!statusData?.connected;

  // Fetch client ID
  const { data: clientData } = useQuery({
    queryKey: ['githubClientId'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/integrations/github/client-id`
      );
      const json = await res.json();
      return json.data;
    }
  });

  // Fetch repos
  const { data: reposData, isLoading: reposLoading, refetch: refetchRepos } = useQuery({
    queryKey: ['githubRepos', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/integrations/github/${projectId}/repos`);
      return data.data;
    },
    enabled: isConnected
  });

  // Fetch repo tree
  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['githubTree', projectId, selectedRepo?.full_name],
    queryFn: async () => {
      if (!selectedRepo) return [];
      const [owner, repo] = selectedRepo.full_name.split('/');
      const { data } = await apiClient.get(`/api/integrations/github/${projectId}/repos/${owner}/${repo}/tree`);
      return data.data;
    },
    enabled: isConnected && !!selectedRepo && activeTab === 'files'
  });

  // Fetch file contents
  const { data: fileContentData, isLoading: fileContentLoading } = useQuery({
    queryKey: ['githubFileContent', projectId, selectedRepo?.full_name, selectedFile?.path],
    queryFn: async () => {
      if (!selectedRepo || !selectedFile) return null;
      const [owner, repo] = selectedRepo.full_name.split('/');
      const { data } = await apiClient.get(`/api/integrations/github/${projectId}/repos/${owner}/${repo}/contents?path=${encodeURIComponent(selectedFile.path)}`);
      return data.data;
    },
    enabled: isConnected && !!selectedRepo && !!selectedFile
  });

  // Fetch commits
  const { data: commitsData, isLoading: commitsLoading } = useQuery({
    queryKey: ['githubCommits', projectId, selectedRepo?.full_name],
    queryFn: async () => {
      if (!selectedRepo) return [];
      const [owner, repo] = selectedRepo.full_name.split('/');
      const { data } = await apiClient.get(`/api/integrations/github/${projectId}/repos/${owner}/${repo}/commits`);
      return data.data;
    },
    enabled: isConnected && !!selectedRepo && activeTab === 'commits'
  });

  // Fetch PRs
  const { data: pullsData, isLoading: pullsLoading } = useQuery({
    queryKey: ['githubPulls', projectId, selectedRepo?.full_name],
    queryFn: async () => {
      if (!selectedRepo) return [];
      const [owner, repo] = selectedRepo.full_name.split('/');
      const { data } = await apiClient.get(`/api/integrations/github/${projectId}/repos/${owner}/${repo}/pulls`);
      return data.data;
    },
    enabled: isConnected && !!selectedRepo && activeTab === 'pulls'
  });

  // Disconnect
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/integrations/github/disconnect', { projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['githubStatus', projectId]);
      setSelectedRepo(null);
    }
  });

  // Sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const [owner, repo] = selectedRepo.full_name.split('/');
      const { data } = await apiClient.post(`/api/integrations/github/${projectId}/repos/${owner}/${repo}/sync`);
      return data;
    },
    onSuccess: (data) => {
      alert(`Successfully synced ${data.data?.syncedFiles} files from the repository to your workspace!`);
      queryClient.invalidateQueries(['workspace-files', projectId]);
    },
    onError: (err) => {
      alert('Failed to sync repository: ' + err.message);
    }
  });

  const handleConnectClick = () => {
    if (!clientData?.clientId) return;
    const redirectUri = window.location.origin + '/workspace';
    const state = btoa(JSON.stringify({ projectId, userId: user?.id }));
    window.location.href =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientData.clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=repo` +
      `&state=${encodeURIComponent(state)}`;
  };

  // ── Loading / connecting ──
  if (statusQueryStatus === 'pending' || connectMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
        <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
        <p className="text-sm text-ink-3">
          {connectMutation.isPending ? 'Finalizing GitHub connection…' : 'Loading GitHub integration…'}
        </p>
      </div>
    );
  }

  // ── Error state ──
  if (connectMutation.isError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <div className="text-danger bg-danger/10 p-3 rounded-full">
          <LogOut className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Connection Failed</h3>
          <p className="text-xs text-ink-3 mt-1 max-w-[240px]">
            {connectMutation.error?.message || 'Something went wrong while connecting to GitHub.'}
          </p>
        </div>
        <button
          onClick={() => {
            hasProcessed.current = false;
            connectMutation.reset();
          }}
          className="text-xs font-semibold text-ink underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Not connected ──
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-5 p-8 text-center">
        <div className="w-14 h-14 rounded-card bg-bg border border-border flex items-center justify-center">
          <GithubIcon className="w-7 h-7 text-ink" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Connect to GitHub</h3>
          <p className="text-xs text-ink-3 mt-1 max-w-[260px] leading-relaxed">
            Explore repositories, view commits, and track pull requests directly in your workspace.
          </p>
        </div>
        <button
          onClick={handleConnectClick}
          disabled={!clientData?.clientId}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-ink hover:bg-black rounded-input ${BUTTON_BASE}`}
        >
          <GithubIcon className="w-4 h-4" />
          Connect GitHub
        </button>
      </div>
    );
  }

  // ── Connected ──
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <GithubIcon className="w-4 h-4 text-ink" />
          <div>
            <span className="text-[13px] font-semibold text-ink leading-none">GitHub</span>
            <span className="block text-[11px] text-ink-3 leading-none mt-0.5">
              {statusData.username}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => refetchRepos()}
            className={`p-1.5 rounded-input text-ink-3 hover:text-ink hover:bg-bg ${BUTTON_BASE}`}
            title="Refresh repositories"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => disconnectMutation.mutate()}
            className={`p-1.5 rounded-input text-ink-3 hover:text-danger hover:bg-danger/5 ${BUTTON_BASE}`}
            title="Disconnect"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 py-4">
        {!selectedRepo ? (
          /* ── Repository List ── */
          <>
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest mb-3">
              Your Repositories
            </p>
            {reposLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {reposData?.map(repo => {
                  const isVectorised = statusData?.lastSyncedRepo === repo.full_name;
                  const syncedAt = isVectorised ? timeAgo(statusData?.lastSync) : null;
                  return (
                    <div
                      key={repo.id}
                      onClick={() => {
                        setSelectedRepo(repo);
                        onRepoSelect?.(repo.full_name);
                      }}
                      className="flex items-center justify-between px-3 py-2.5 rounded-input border border-border bg-surface hover:border-ink/20 hover:bg-bg cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCode className="w-4 h-4 text-ink-3 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">
                            {repo.name}
                          </p>
                          <p className="text-[11px] text-ink-3 truncate">{repo.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isVectorised && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-success/10 border border-success/25 text-success text-[10px] font-semibold rounded-pill">
                            <CheckCircle2 size={9} />
                            {syncedAt ? `synced ${syncedAt}` : 'synced'}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-ink-3 group-hover:text-ink transition-colors" />
                      </div>
                    </div>
                  );
                })}
                {reposData?.length === 0 && (
                  <p className="text-sm text-ink-3 text-center py-6">No repositories found.</p>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── Repo Explorer ── */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Breadcrumb + actions */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-1.5 text-[12px]">
                <button
                  onClick={() => { setSelectedRepo(null); setCurrentPath(''); setSelectedFile(null); }}
                  className="text-ink-3 hover:text-ink font-medium transition-colors"
                >
                  Repositories
                </button>
                <span className="text-border">/</span>
                <span className="font-semibold text-ink">{selectedRepo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold text-brand bg-brand/10 hover:bg-brand/20 px-2.5 py-1 rounded-input ${BUTTON_BASE}`}
                >
                  {syncMutation.isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Database className="w-3 h-3" />}
                  {syncMutation.isPending ? 'Syncing…' : 'Sync to Workspace'}
                </button>
                <a
                  href={selectedRepo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-ink-3 hover:text-ink transition-colors"
                >
                  Open ↗
                </a>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-bg p-1 rounded-input border border-border mb-4 shrink-0">
              {[
                { id: 'files',   icon: FileCode,        label: 'Files' },
                { id: 'commits', icon: GitCommit,       label: 'Commits' },
                { id: 'pulls',   icon: GitPullRequest,  label: 'Pull Requests' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedFile(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-[6px] transition-all ${
                    activeTab === tab.id
                      ? 'bg-surface text-ink border border-border shadow-sm'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="flex-1 overflow-y-auto border border-border rounded-input bg-surface relative">
                {selectedFile ? (
                  <div className="flex flex-col h-full absolute inset-0 bg-surface z-10">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-bg sticky top-0">
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-ink transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        Back
                      </button>
                      <span className="text-xs font-semibold text-ink truncate">{selectedFile.path}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {fileContentLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
                        </div>
                      ) : (
                        <pre className="text-xs text-ink font-mono whitespace-pre-wrap break-all leading-6">
                          <code>
                            {fileContentData?.content
                              ? decodeBase64(fileContentData.content)
                              : 'Unable to load file content.'}
                          </code>
                        </pre>
                      )}
                    </div>
                  </div>
                ) : treeLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
                  </div>
                ) : (
                  <FileTree
                    data={treeData}
                    repoUrl={selectedRepo.html_url}
                    onFileClick={(node) => setSelectedFile(node)}
                  />
                )}
              </div>
            )}

            {/* Commits Tab */}
            {activeTab === 'commits' && (
              <div className="flex-1 overflow-y-auto space-y-2">
                {commitsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-ink-3" />
                  </div>
                ) : (
                  commitsData?.map(commit => (
                    <div
                      key={commit.sha}
                      className="px-3 py-2.5 border border-border rounded-input bg-surface hover:border-ink/20 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <GitCommit className="w-3.5 h-3.5 text-ink-3 mt-0.5 shrink-0" />
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-ink hover:text-brand line-clamp-2 transition-colors"
                        >
                          {commit.message}
                        </a>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-ink-3 ml-5">
                        <span className="font-medium text-ink-2">{commit.author}</span>
                        <span>{new Date(commit.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
                {commitsData?.length === 0 && (
                  <p className="text-xs text-center text-ink-3 py-6">No commits found.</p>
                )}
              </div>
            )}

            {/* Pulls Tab */}
            {activeTab === 'pulls' && (
              <div className="flex-1 overflow-y-auto space-y-2">
                {pullsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-ink-3" />
                  </div>
                ) : (
                  pullsData?.map(pr => (
                    <div
                      key={pr.number}
                      className="px-3 py-2.5 border border-border rounded-input bg-surface hover:border-ink/20 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <GitPullRequest className="w-3.5 h-3.5 text-ink-3 mt-0.5 shrink-0" />
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-ink hover:text-brand line-clamp-2 transition-colors"
                        >
                          {pr.title}
                        </a>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-ink-3 ml-5">
                        <span>#{pr.number} · <span className="font-medium text-ink-2">{pr.user}</span></span>
                        <span className={`capitalize font-semibold ${pr.state === 'open' ? 'text-success' : 'text-ink-3'}`}>
                          {pr.state}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {pullsData?.length === 0 && (
                  <p className="text-xs text-center text-ink-3 py-6">No pull requests found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
