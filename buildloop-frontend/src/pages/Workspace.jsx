import { useParams } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from 'framer-motion';
import { ChatInterface } from "../components/workspace/ChatInterface";
import GithubIntegration from "../components/workspace/GithubIntegration";
import { useWorkspace } from "../hooks/useWorkspace";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const MIN_LEFT_PCT = 30;
const MAX_LEFT_PCT = 85;

export default function WorkspacePage() {
  const params = useParams();
  const projectId = params?.projectId || "demo-project";

  const {
    upload,
    isUploading,
    uploadError,
    ask,
    messages,
    isAsking,
    askError,
    clearHistory,
    files = [],
  } = useWorkspace(projectId);

  const hasFiles = true;

  const [activeRepo, setActiveRepo] = useState(null);

  // Draggable split — persisted in state as percentage (0–100)
  const [leftPct, setLeftPct] = useState(60);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setLeftPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct)));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Mobile tab state
  const [activeTab, setActiveTab] = useState('git');

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-6 px-4 md:py-10">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <div className="z-10 w-full max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-160px)] min-h-[500px]">
        {/* Page Header */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 shrink-0"
        >
          <h1 className="text-[22px] font-semibold text-ink leading-tight">Workspace</h1>
          <p className="text-sm text-ink-3 mt-0.5">
            Explore your GitHub repositories and ask AI questions about your codebase
          </p>
        </motion.div>

        {/* ── MOBILE: Tab bar ── */}
        <div className="md:hidden flex shrink-0 mb-3 bg-surface border border-border rounded-card p-1 gap-1">
          <button
            id="workspace-tab-git"
            onClick={() => setActiveTab('git')}
            className={`flex-1 py-2 text-sm font-semibold rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
              activeTab === 'git'
                ? 'bg-ink text-surface'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            Git
          </button>
          <button
            id="workspace-tab-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-sm font-semibold rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
              activeTab === 'chat'
                ? 'bg-ink text-surface'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            Chat
          </button>
        </div>

        {/* ── MOBILE: Single active panel ── */}
        <div className="md:hidden flex-1 min-h-0 overflow-hidden">
          {activeTab === 'git' ? (
            <div className="h-full bg-surface border border-border rounded-card overflow-hidden">
              <GithubIntegration projectId={projectId} onRepoSelect={setActiveRepo} />
            </div>
          ) : (
            <div className="h-full">
              <ChatInterface
                messages={messages}
                isAsking={isAsking}
                askError={askError}
                onAsk={(q) => ask(q, activeRepo)}
                onClear={clearHistory}
                hasFiles={hasFiles}
                activeRepo={activeRepo}
              />
            </div>
          )}
        </div>

        {/* ── DESKTOP: Resizable split panels ── */}
        <motion.div
          ref={containerRef}
          className="hidden md:flex flex-1 min-h-0 gap-0"
          variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
          initial="initial"
          animate="animate"
        >
          {/* LEFT PANEL — GitHub Integration */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="bg-surface border border-border rounded-card flex flex-col overflow-hidden"
            style={{ width: `${leftPct}%` }}
          >
            <GithubIntegration projectId={projectId} onRepoSelect={setActiveRepo} />
          </motion.div>

          {/* DRAG HANDLE */}
          <div
            onMouseDown={onMouseDown}
            className="group flex-shrink-0 w-3 flex items-center justify-center cursor-col-resize z-10 select-none"
            title="Drag to resize"
          >
            <div className="w-0.5 h-10 rounded-pill bg-border group-hover:bg-brand/40 transition-colors" />
          </div>

          {/* RIGHT PANEL — Chat Q&A */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 min-w-0 min-h-0"
          >
            <ChatInterface
              messages={messages}
              isAsking={isAsking}
              askError={askError}
              onAsk={(q) => ask(q, activeRepo)}
              onClear={clearHistory}
              hasFiles={hasFiles}
              activeRepo={activeRepo}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}