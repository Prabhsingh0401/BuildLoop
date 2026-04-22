import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client.js';
import { Loader2, RefreshCw, LogOut, ChevronRight, FileCode, GitCommit, GitPullRequest, Folder, File as FileIcon, Database } from 'lucide-react';

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
import { motion, AnimatePresence } from 'framer-motion';
import FileTree from './FileTree';

const decodeBase64 = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    try {
      return atob(str);
    } catch(e2) {
      return 'Error decoding file content.';
    }
  }
};

export default function GithubIntegration({ projectId }) {
  const queryClient = useQueryClient();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [activeTab, setActiveTab] = useState('files'); // files, commits, pulls
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle OAuth callback on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && projectId) {
      connectMutation.mutate(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [projectId]);

  // Fetch status
  const { data: statusData, isLoading: statusLoading } = useQuery({
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
      const { data } = await apiClient.get('/api/integrations/github/client-id');
      return data.data;
    }
  });

  // Fetch repos if connected
  const { data: reposData, isLoading: reposLoading, refetch: refetchRepos } = useQuery({
    queryKey: ['githubRepos', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/integrations/github/${projectId}/repos`);
      return data.data;
    },
    enabled: isConnected
  });

  // Fetch repo tree
  const { data: treeData, isLoading: treeLoading, refetch: refetchTree } = useQuery({
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

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (code) => {
      await apiClient.post('/api/integrations/github/connect', { projectId, code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['githubStatus', projectId]);
      queryClient.invalidateQueries(['githubRepos', projectId]);
    }
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/integrations/github/disconnect', { projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['githubStatus', projectId]);
      setSelectedRepo(null);
    }
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const [owner, repo] = selectedRepo.full_name.split('/');
      const { data } = await apiClient.post(`/api/integrations/github/${projectId}/repos/${owner}/${repo}/sync`);
      return data;
    },
    onSuccess: (data) => {
      alert(`Successfully synced ${data.data?.syncedFiles} files from the repository to your workspace! You can now ask questions about the codebase.`);
      queryClient.invalidateQueries(['workspace-files', projectId]);
    },
    onError: (err) => {
      alert('Failed to sync repository: ' + err.message);
    }
  });

  const handleConnectClick = () => {
    if (!clientData?.clientId) return;
    const redirectUri = window.location.origin + window.location.pathname;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientData.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;
  };

  if (statusLoading || connectMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Loading GitHub integration...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
          <GithubIcon className="w-8 h-8 text-gray-700" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Connect to GitHub</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-[250px]">
            Explore repositories, view commits, and track pull requests directly in your workspace.
          </p>
        </div>
        <button
          onClick={handleConnectClick}
          disabled={!clientData?.clientId}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2da44e] rounded-lg hover:bg-[#2c974b] transition-colors disabled:opacity-50"
        >
          <GithubIcon className="w-4 h-4" />
          Connect GitHub Auth
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <GithubIcon className="w-4 h-4 text-gray-700" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900 leading-none">GitHub</h3>
            <span className="text-[11px] text-gray-500">Connected as {statusData.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchRepos()}
            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-50"
            title="Refresh Repositories"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => disconnectMutation.mutate()}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!selectedRepo ? (
        <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your Repositories</p>
          {reposLoading ? (
            <div className="flex items-center justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : (
            <div className="space-y-2">
              {reposData?.map(repo => (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className="p-3 rounded-lg border border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{repo.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{repo.full_name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                </div>
              ))}
              {reposData?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No repositories found.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 pt-4">
          {/* Repo Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setSelectedRepo(null); setCurrentPath(''); setSelectedFile(null); }}
                className="text-[11px] text-gray-500 hover:text-gray-900 font-medium tracking-wide flex items-center"
              >
                Repositories
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-[12px] font-semibold text-gray-900">{selectedRepo.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand/80 disabled:opacity-50 transition-colors bg-brand/10 px-2 py-1 rounded"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-3 h-3" />
                )}
                {syncMutation.isPending ? 'Syncing...' : 'Sync to Workspace'}
              </button>
              <a 
                href={selectedRepo.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] text-blue-500 hover:text-blue-600 font-medium"
              >
                Open in GitHub
              </a>
            </div>
          </div>

          {/* Context Tabs */}
          <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-lg border border-gray-100 mb-4 shrink-0">
            {[
              { id: 'files', icon: FileCode, label: 'Files' },
              { id: 'commits', icon: GitCommit, label: 'Commits' },
              { id: 'pulls', icon: GitPullRequest, label: 'Pull Requests' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedFile(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-100 rounded-lg bg-white relative">
              {selectedFile ? (
                <div className="flex flex-col h-full absolute inset-0 bg-white z-10">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors flex items-center gap-1 text-xs font-medium"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      Back
                    </button>
                    <span className="text-xs font-semibold text-gray-700 truncate">{selectedFile.path}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 text-xs custom-scrollbar">
                    {fileContentLoading ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                    ) : (
                      <pre className="text-gray-800 font-mono whitespace-pre-wrap break-all">
                        <code>
                          {fileContentData?.content ? decodeBase64(fileContentData.content) : 'Unable to load file content.'}
                        </code>
                      </pre>
                    )}
                  </div>
                </div>
              ) : treeLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {commitsLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
              ) : (
                commitsData?.map(commit => (
                  <div key={commit.sha} className="p-3 border border-gray-100 rounded-lg text-sm group hover:border-gray-200">
                    <div className="flex items-start gap-2 mb-1">
                      <GitCommit className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
                        {commit.message}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 ml-6">
                      <span className="font-medium text-gray-700">{commit.author}</span>
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
              {commitsData?.length === 0 && <p className="text-xs text-center text-gray-400 py-4">No commits found.</p>}
            </div>
          )}

          {/* Pulls Tab */}
          {activeTab === 'pulls' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {pullsLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
              ) : (
                pullsData?.map(pr => (
                  <div key={pr.number} className="p-3 border border-gray-100 rounded-lg text-sm group hover:border-gray-200">
                    <div className="flex items-start gap-2 mb-1">
                      <GitPullRequest className={`w-4 h-4 mt-0.5 shrink-0 ${pr.state === 'open' ? 'text-green-500' : 'text-purple-500'}`} />
                      <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
                        {pr.title}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 ml-6">
                      <span>#{pr.number} by <span className="font-medium text-gray-700">{pr.user}</span></span>
                      <span className="capitalize">{pr.state}</span>
                    </div>
                  </div>
                ))
              )}
              {pullsData?.length === 0 && <p className="text-xs text-center text-gray-400 py-4">No pull requests found.</p>}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
