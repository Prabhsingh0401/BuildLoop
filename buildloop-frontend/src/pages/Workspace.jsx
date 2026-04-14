import { useParams } from "react-router-dom";
import { motion } from 'framer-motion';
import { ChatInterface } from "../components/workspace/ChatInterface";
import { CodeUpload } from "../components/workspace/CodeUpload";
import { useWorkspace } from "../hooks/useWorkspace";

const CARD_BASE =
  'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function WorkspacePage() {
  // ✅ Get projectId from route (if routing exists)
  const params = useParams();

  // Fallback for now (so app doesn't break)
  const projectId = params?.projectId || "demo-project";

  const {
    upload, // For file uploads
    isUploading,
    uploadError,
    ask,
    messages,
    isAsking,
    askError,
    clearHistory,
    files = [], // ✅ assume hook gives files (safe default)
  } = useWorkspace(projectId);

  // ✅ REAL logic (no hardcoding)
  const hasFiles = files.length > 0;

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <div className="z-10 w-full max-w-6xl mx-auto">
        {/* Page Header */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 className="text-[22px] font-semibold text-ink leading-tight">Workspace</h1>
          <p className="text-sm text-ink-3 mt-0.5">
            Upload your code and chat with AI to start asking questions
          </p>
        </motion.div>

        {/* Content Panels */}
        <motion.div 
          className="flex h-[calc(100vh-280px)] gap-6"
          variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
          initial="initial"
          animate="animate"
        >
          {/* LEFT PANEL - Code Upload (50%) */}
          <motion.div 
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className={`${CARD_BASE} w-1/2 flex-shrink-0 flex flex-col gap-4 overflow-y-auto p-6`}
          >
            <h2 className="text-[15px] font-semibold text-ink">Upload Code</h2>
            <CodeUpload 
              onUpload={upload}
              isUploading={isUploading}
              uploadError={uploadError}
              files={files}
            />
          </motion.div>

          {/* RIGHT PANEL - Chat Interface */}
          <motion.div 
            variants={fadeUp}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-1/2 flex-shrink-0 min-h-0"
          >
            <ChatInterface
              messages={messages}
              isAsking={isAsking}
              askError={askError}
              onAsk={ask}
              onClear={clearHistory}
              hasFiles={hasFiles}
            />
          </motion.div>

        </motion.div>
      </div>

    </div>
  );
}