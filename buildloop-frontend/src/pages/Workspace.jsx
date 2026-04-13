import { useParams } from "react-router-dom";
import { ChatInterface } from "../components/workspace/ChatInterface";
import { useWorkspace } from "../hooks/useWorkspace";

export default function WorkspacePage() {
  // ✅ Get projectId from route (if routing exists)
  const params = useParams();

  // Fallback for now (so app doesn't break)
  const projectId = params?.projectId || "demo-project";

  const {
    upload, // (used later by Eshaa)
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
    <div className="flex h-[calc(100vh-120px)] gap-6 p-6 bg-bg">

      {/* LEFT PANEL (Eshaa's section) */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-card p-5 text-sm text-ink-3 text-center">
          Upload panel (handled by Eshaa)
        </div>

        {/* Optional: show files (safe + useful) */}
        <div className="bg-surface border border-border rounded-card p-4 text-xs text-ink-2">
          <p className="font-semibold mb-2">Files</p>

          {hasFiles ? (
            files.map((file) => (
              <p key={file._id} className="truncate">
                {file.fileName}
              </p>
            ))
          ) : (
            <p>No files uploaded</p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Top label */}
        {messages.length === 0 && (
          <p className="text-sm text-ink-3 mb-2 px-1">
            No messages yet
          </p>
        )}

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={messages}
            isAsking={isAsking}
            askError={askError}
            onAsk={ask}
            onClear={clearHistory}
            hasFiles={hasFiles}
          />
        </div>

      </div>

    </div>
  );
}