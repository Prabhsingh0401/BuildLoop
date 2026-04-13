import { ChatInterface } from "../components/workspace/ChatInterface";
import { useWorkspace } from "../hooks/useWorkspace";

export default function WorkspacePage() {
  const projectId = "YOUR_PROJECT_ID";

  const {
    upload,
    isUploading,
    uploadError,
    ask,
    messages,
    isAsking,
    askError,
    clearHistory,
  } = useWorkspace(projectId);

  const hasFiles = true;

  async function handleUpload(files) {
    await upload(files);
    clearHistory();
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 p-6 bg-bg">

      {/* LEFT PANEL */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-card p-5 text-sm text-ink-3 text-center">
          CodeUpload panel — Eshaa
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