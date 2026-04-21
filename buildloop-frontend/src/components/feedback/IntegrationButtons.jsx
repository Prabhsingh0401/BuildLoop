import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
  getSlackStatus,
  connectSlack,
  disconnectSlack,
  syncSlack,
  getRedditStatus,
  connectReddit,
  disconnectReddit,
  syncReddit
} from '@/services/integrationService';
import useProjectStore from '@/store/projectStore';

const MINI_CARD = 'bg-white/40 backdrop-blur-md border border-white/30 rounded-xl';

export default function IntegrationButtons() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { activeProjectId } = useProjectStore();
  const [showSetup, setShowSetup] = useState(null);
  const [integrations, setIntegrations] = useState({
    slack: { loading: true, connected: false },
    reddit: { loading: true, connected: false }
  });
  const [isSyncing, setIsSyncing] = useState({ slack: false, reddit: false });
  const [slackForm, setSlackForm] = useState({
    botToken: '',
    channelName: ''
  });
  const [redditForm, setRedditForm] = useState({
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    subredditName: ''
  });
  
  // Scoped error/success for form modals
  const [modalError, setModalError] = useState('');
  
  // General error/success for main view actions (sync, disconnect, etc.)
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!activeProjectId) return;
    loadStatuses();
  }, [activeProjectId]);

  const loadStatuses = async () => {
    if (!activeProjectId) return;
    setIntegrations(prev => ({
      slack: { ...prev.slack, loading: true },
      reddit: { ...prev.reddit, loading: true }
    }));

    try {
      const token = await getToken();
      const [slackRes, redditRes] = await Promise.allSettled([
        getSlackStatus(activeProjectId, token),
        getRedditStatus(activeProjectId, token)
      ]);

      setIntegrations({
        slack: {
          loading: false,
          connected: false,
          ...(slackRes.status === 'fulfilled' ? slackRes.value.data : {})
        },
        reddit: {
          loading: false,
          connected: false,
          ...(redditRes.status === 'fulfilled' ? redditRes.value.data : {})
        }
      });
    } catch {
      setIntegrations({
        slack: { loading: false, connected: false },
        reddit: { loading: false, connected: false }
      });
    }
  };

  const handleConnectSlack = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!slackForm.botToken.trim()) {
      setModalError('Bot token is required');
      return;
    }
    if (!slackForm.channelName.trim()) {
      setModalError('Channel name is required');
      return;
    }
    if (!activeProjectId) {
      setModalError('No project selected. Please select a project first.');
      return;
    }

    setIsConnecting(true);
    try {
      const token = await getToken();
      const res = await connectSlack({
        projectId: activeProjectId,
        botToken: slackForm.botToken.trim(),
        channelName: slackForm.channelName.trim()
      }, token);

      setIntegrations(prev => ({ ...prev, slack: { loading: false, connected: true, ...res.data } }));
      setGlobalSuccess(`Connected to Slack in #${res.data.channelName}`);
      setShowSetup(null);
      setSlackForm({ botToken: '', channelName: '' });
      setTimeout(() => setGlobalSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to connect Slack');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectReddit = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsConnecting(true);
    try {
      const token = await getToken();
      const res = await connectReddit({ projectId: activeProjectId, ...redditForm }, token);
      setIntegrations(prev => ({ ...prev, reddit: { loading: false, connected: true, ...res.data } }));
      setGlobalSuccess(`Connected to r/${res.data.subredditName}`);
      setShowSetup(null);
      setRedditForm({ clientId: '', clientSecret: '', refreshToken: '', subredditName: '' });
      setTimeout(() => setGlobalSuccess(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to connect Reddit');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (type) => {
    setGlobalError('');
    try {
      const token = await getToken();
      if (type === 'slack') await disconnectSlack(activeProjectId, token);
      else await disconnectReddit(activeProjectId, token);
      setIntegrations(prev => ({ ...prev, [type]: { loading: false, connected: false } }));
      setGlobalSuccess(`${type === 'slack' ? 'Slack' : 'Reddit'} disconnected`);
      setTimeout(() => setGlobalSuccess(''), 3000);
    } catch (err) {
      setGlobalError(err.message || 'Failed to disconnect');
      setTimeout(() => setGlobalError(''), 4000);
    }
  };

  const handleSync = async (type) => {
    setGlobalError('');
    setIsSyncing(prev => ({ ...prev, [type]: true }));
    try {
      const token = await getToken();
      if (type === 'slack') await syncSlack({ projectId: activeProjectId }, token);
      else await syncReddit({ projectId: activeProjectId }, token);
      
      // Invalidate queries to trigger a refetch of the feedback history
      queryClient.invalidateQueries({ queryKey: ['feedbacks', activeProjectId] });
      
      setGlobalSuccess(`Successfully synced ${type === 'slack' ? 'Slack messages' : 'Reddit posts'}!`);
      setTimeout(() => setGlobalSuccess(''), 3000);
    } catch (err) {
      setGlobalError(err.message || 'Sync failed');
      setTimeout(() => setGlobalError(''), 4000);
    } finally {
      setIsSyncing(prev => ({ ...prev, [type]: false }));
    }
  };

  const openSetup = (type) => {
    setModalError('');
    setShowSetup(type);
  };

  const renderSlackIcon = (isConnected) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isConnected ? 'none' : 'currentColor'}>
      {isConnected ? (
        <>
          <path d="M5.04 15.17a2.52 2.52 0 10-2.52 2.52h2.52v-2.52zM6.31 15.17v6.31a2.52 2.52 0 105.04 0v-6.31H6.31z" fill="#36C5F0" />
          <path d="M8.83 5.04a2.52 2.52 0 102.52-2.52v2.52H8.83zM8.83 6.31H2.52a2.52 2.52 0 100 5.04h6.31V6.31z" fill="#2EB67D" />
          <path d="M18.96 8.83a2.52 2.52 0 102.52-2.52h-2.52v2.52zM17.69 8.83V2.52a2.52 2.52 0 10-5.04 0v6.31h5.04z" fill="#E01E5A" />
          <path d="M15.17 18.96a2.52 2.52 0 10-2.52 2.52v-2.52h2.52zM15.17 17.69h6.31a2.52 2.52 0 100-5.04h-6.31v5.04z" fill="#ECB22E" />
        </>
      ) : (
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm9.124 2.521a2.528 2.528 0 0 1 2.52-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.834zm-1.27 0a2.528 2.528 0 0 1-2.522 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 13.986 0a2.528 2.528 0 0 1 2.522 2.522v6.312zm-2.522 9.124a2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.523 2.528 2.528 0 0 1-2.521-2.523v-2.52h2.521zm0-1.27a2.528 2.528 0 0 1-2.521-2.522 2.528 2.528 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 13.986a2.528 2.528 0 0 1-2.522 2.522h-6.313z" />
      )}
    </svg>
  );

  const renderRedditIcon = (isConnected) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isConnected ? '#FF4500' : 'currentColor'}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.25-1.25-1.25zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );

  const IntegrationMiniCard = ({ type, icon, data }) => {
    const isConnected = data.connected;
    const isLoading = data.loading;

    return (
      <div className={`flex items-center gap-2 px-3 py-2.5 ${MINI_CARD} transition-all duration-300 ${
        isConnected ? 'border-border bg-white shadow-sm' : 'grayscale opacity-60'
      }`}>
        <div className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          isConnected ? 'bg-transparent' : 'text-ink-3 bg-ink/5'
        }`}>
          {icon}
          {isConnected && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold truncate capitalize ${isConnected ? 'text-ink' : 'text-ink-3'}`}>{type}</p>
          {isLoading ? (
            <p className="text-[10px] text-ink-3">Checking…</p>
          ) : isConnected ? (
            <p className="text-[10px] text-ink-2 font-medium truncate">
              {type === 'slack' ? `#${data.channelName}` : `r/${data.subredditName}`}
              {' · '}
              <span className="text-emerald-500 font-semibold">Connected</span>
            </p>
          ) : (
            <p className="text-[10px] text-ink-3">Not connected</p>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-3" />
          ) : isConnected ? (
            <>
              <button onClick={() => handleSync(type)} disabled={isSyncing[type]} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100/50 transition-colors" title="Sync now">
                {isSyncing[type] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => handleDisconnect(type)} className="p-1.5 rounded-lg text-ink-3 hover:text-danger hover:bg-danger/10 transition-colors" title="Disconnect">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button onClick={() => openSetup(type)} className="px-2 py-1 text-[10px] font-semibold text-brand bg-brand/10 hover:bg-brand/20 rounded-md transition-colors">
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!activeProjectId) return null;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5 text-ink-3" />
        <span className="text-xs font-medium text-ink-3">External Sources</span>
      </div>

      {/* Compact Cards */}
      <div className="grid grid-cols-2 gap-2">
        <IntegrationMiniCard type="slack" icon={renderSlackIcon(integrations.slack.connected)} data={integrations.slack} />
        <IntegrationMiniCard type="reddit" icon={renderRedditIcon(integrations.reddit.connected)} data={integrations.reddit} />
      </div>

      {/* Global Status Messages */}
      <AnimatePresence>
        {globalError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg">
            <p className="text-[11px] text-danger flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{globalError}</span>
            </p>
          </motion.div>
        )}
        {globalSuccess && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="p-2.5 bg-emerald-50 border border-emerald-200/50 rounded-lg">
            <p className="text-[11px] text-emerald-600 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{globalSuccess}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup Modal - Portaled to document.body to escape CSS stacking contexts and overflow clips */}
      {createPortal(
        <AnimatePresence>
          {showSetup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowSetup(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-white/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                      {showSetup === 'slack' ? renderSlackIcon(true) : renderRedditIcon(true)}
                    </div>
                    <h4 className="font-semibold text-ink text-sm">Connect {showSetup === 'slack' ? 'Slack' : 'Reddit'}</h4>
                  </div>
                  <button onClick={() => setShowSetup(null)} className="p-1 rounded-lg hover:bg-black/5 text-ink-3 hover:text-ink transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4 overflow-y-auto">
                  {modalError && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl flex gap-2 items-start shrink-0">
                      <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                      <p className="text-xs text-danger pr-2 leading-relaxed">{modalError}</p>
                    </div>
                  )}
                  
                  {showSetup === 'slack' ? (
                    <form onSubmit={handleConnectSlack} className="space-y-5">
                      
                      <div className="space-y-4">
                        {/* Bot Token Input */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-ink ml-1">Slack Bot Token</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-3 group-focus-within:text-brand transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </div>
                            <input 
                              type="password" 
                              value={slackForm.botToken} 
                              onChange={e => setSlackForm(prev => ({ ...prev, botToken: e.target.value }))} 
                              placeholder="xoxb-your-token-here..." 
                              className="w-full pl-10 pr-4 py-3 bg-white/70 border border-border rounded-input text-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all hover:bg-white" 
                              required 
                            />
                          </div>
                          <p className="text-[10px] text-ink-3 ml-1">Always starts with <code className="bg-ink/5 px-1 py-0.5 rounded font-mono text-ink">xoxb-</code></p>
                        </div>

                        {/* Channel Name Input */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-ink ml-1">Channel to Sync</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-3 font-mono font-medium opacity-60 group-focus-within:opacity-100 group-focus-within:text-brand transition-colors">
                              #
                            </div>
                            <input 
                              type="text" 
                              value={slackForm.channelName} 
                              onChange={e => setSlackForm(prev => ({ ...prev, channelName: e.target.value }))} 
                              placeholder="product-feedback" 
                              className="w-full pl-8 pr-4 py-3 bg-white/70 border border-border rounded-input text-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all hover:bg-white" 
                              required 
                            />
                          </div>
                          <p className="text-[10px] text-ink-3 ml-1">Enter without the hash symbol</p>
                        </div>
                      </div>
                      
                      {/* Setup Instructions Card */}
                      <div className="relative overflow-hidden rounded-xl bg-brand/5 border border-brand/10 p-4">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
                        <h4 className="text-xs font-semibold text-ink mb-3 flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-brand" />
                          Quick Setup Guide
                        </h4>
                        <ol className="text-[11px] text-ink-2 space-y-2 relative ml-1">
                          <li className="flex gap-2 items-start">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[9px] mt-0.5">1</span>
                            <span>Create an app at <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-brand font-medium hover:underline">api.slack.com/apps</a></span>
                          </li>
                          <li className="flex gap-2 items-start">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[9px] mt-0.5">2</span>
                            <span>In <strong>OAuth & Permissions</strong>, add Bot Token Scopes: <code className="bg-white px-1 py-0.5 border border-border rounded font-mono text-[9px]">channels:read</code> and <code className="bg-white px-1 py-0.5 border border-border rounded font-mono text-[9px]">channels:history</code></span>
                          </li>
                          <li className="flex gap-2 items-start">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[9px] mt-0.5">3</span>
                            <span><strong>Install to Workspace</strong> and paste the OAuth Token above</span>
                          </li>
                          <li className="flex gap-2 items-start">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[9px] mt-0.5">4</span>
                            <span>In your Slack channel, type <code className="bg-white px-1 py-0.5 border border-border rounded text-brand font-mono text-[10px] font-medium">/invite @YourBotName</code></span>
                          </li>
                        </ol>
                      </div>

                      <div className="pt-1">
                        <button 
                          type="submit" 
                          disabled={isConnecting} 
                          className="w-full py-3 bg-brand hover:bg-brand/90 text-white font-semibold rounded-card shadow-glow-brand transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isConnecting ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Connection...</> : 'Connect Integration'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleConnectReddit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-ink-2 ml-1">Client ID</label>
                          <input type="text" value={redditForm.clientId} onChange={e => setRedditForm(prev => ({ ...prev, clientId: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 transition-shadow" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-ink-2 ml-1">Client Secret</label>
                          <input type="password" value={redditForm.clientSecret} onChange={e => setRedditForm(prev => ({ ...prev, clientSecret: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 transition-shadow" required />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-ink-2 ml-1">Refresh Token</label>
                        <input type="password" value={redditForm.refreshToken} onChange={e => setRedditForm(prev => ({ ...prev, refreshToken: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 transition-shadow" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-ink-2 ml-1">Subreddit Name</label>
                        <input type="text" value={redditForm.subredditName} onChange={e => setRedditForm(prev => ({ ...prev, subredditName: e.target.value }))} placeholder="e.g. productfeedback (without r/)" className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 transition-shadow" required />
                      </div>

                      <div className="p-3.5 bg-brand/5 border border-brand/10 rounded-xl space-y-2">
                        <p className="text-xs font-semibold text-ink">Required Configuration:</p>
                        <ol className="text-[11px] text-ink-2 list-decimal list-outside ml-3.5 space-y-1.5 leading-relaxed">
                          <li>Visit <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-brand font-medium hover:underline inline-flex items-center gap-0.5">reddit.com/prefs/apps <ExternalLink className="w-2.5 h-2.5" /></a> and create a "script" app</li>
                          <li>Use <code className="bg-white px-1 py-0.5 border border-border rounded text-ink font-mono text-[10px]">http://localhost:8080</code> as the redirect URI</li>
                          <li>Follow the Reddit API guidelines to acquire your Refresh Token</li>
                        </ol>
                      </div>

                      <button type="submit" disabled={isConnecting} className="w-full py-2.5 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl shadow-glow-brand transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
                        {isConnecting ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Connection...</> : 'Connect Integration'}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
