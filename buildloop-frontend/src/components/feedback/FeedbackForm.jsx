import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareText,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
} from 'lucide-react';
import { submitFeedback } from '@/services/feedbackService';
import useProjectStore from '@/store/projectStore';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';

const MIN_LENGTH = 100;

const MODE_TABS = [
  { id: 'paste', label: 'Paste Text', icon: MessageSquareText },
  { id: 'file',  label: 'Upload File', icon: Upload },
];

const CARD_BASE =
  'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

/* ─── Success Banner ─────────────────────────────────────────── */
function SuccessBanner({ chunkCount, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 px-5 py-4 bg-white/50 border border-black/5 rounded-2xl"
    >
      <CheckCircle2 className="w-5 h-5 text-ink-3 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-success">Feedback submitted!</p>
        <p className="text-xs text-success/70 mt-0.5">
          Split into <span className="font-semibold">{chunkCount}</span> chunk
          {chunkCount !== 1 ? 's' : ''} and queued for processing.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-success/50 hover:text-success transition-colors p-0.5 rounded"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/* ─── Error Banner ───────────────────────────────────────────── */
function ErrorBanner({ message, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 px-5 py-4 bg-white/50 border border-black/5 rounded-2xl"
    >
      <AlertCircle className="w-5 h-5 text-ink-3 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-danger">Something went wrong</p>
        <p className="text-xs text-danger/70 mt-0.5">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-danger/50 hover:text-danger transition-colors p-0.5 rounded"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function FeedbackForm() {
  const { activeProjectId } = useProjectStore();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode]           = useState('paste');
  const [text, setText]           = useState('');
  const [file, setFile]           = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess]     = useState(null);  // { chunkCount }
  const [error, setError]         = useState(null);  // string

  const fileInputRef = useRef(null);

  /* ── derived ── */
  const charCount       = text.length;
  const belowMin        = mode === 'paste' && charCount < MIN_LENGTH;
  const isDisabled      = isSubmitting || (mode === 'paste' ? belowMin : !file);

  /* ── drag & drop ── */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let rawText = text;

    if (mode === 'file') {
      if (!file) return;
      rawText = await file.text();
    }

    if (rawText.length < MIN_LENGTH) {
      setError(`Feedback must be at least ${MIN_LENGTH} characters.`);
      return;
    }

    if (!activeProjectId) {
      toast.error('Please select or create a project first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const projectId = activeProjectId;
      const token = await getToken();
      const res = await submitFeedback({
        rawText,
        projectId,
        source: mode,
        metaType: 'other',
      }, token);

      const chunkCount =
        res.data?.chunkCount ??
        res.data?.chunks?.length ??
        res.data?.pineconeIds?.length ??
        0;

      queryClient.invalidateQueries({ queryKey: ['feedbacks', projectId] });

      setSuccess({ chunkCount });
      setText('');
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`${CARD_BASE} p-5 md:p-6 space-y-4`}
      noValidate
    >
      {/* Mode Tabs */}
      <div className="flex gap-1 bg-white/40 backdrop-blur-md rounded-2xl p-1 w-fit border border-white/40 shadow-sm">
        {MODE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setMode(id); setError(null); setSuccess(null); }}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === id
                ? 'text-ink bg-ink/5 shadow-sm border border-black/5'
                : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <AnimatePresence mode="wait">
        {mode === 'paste' ? (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-2"
          >
            <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider block">
              Paste raw feedback
            </label>
            <div className="relative">
              <textarea
                id="feedback-textarea"
                value={text}
                onChange={(e) => { setText(e.target.value); setError(null); }}
                rows={6}
                placeholder="Paste survey responses, interview notes, support tickets…"
                className={`w-full resize-none bg-white/80 border rounded-2xl px-5 py-4 text-sm text-ink placeholder:text-ink-3/60 
                  focus:outline-none focus:ring-2 transition-all duration-200
                  ${belowMin && charCount > 0
                    ? 'border-warn/50 focus:ring-warn/20 focus:border-warn/60'
                    : 'border-border focus:ring-brand/20 focus:border-brand/40'
                  }`}
                disabled={isSubmitting}
              />
              {/* Char counter */}
              <div className={`absolute bottom-3 right-4 text-xs font-medium tabular-nums transition-colors ${
                belowMin && charCount > 0 ? 'text-warn' : 'text-ink-3/50'
              }`}>
                {charCount}
                {belowMin && charCount > 0 && (
                  <span className="ml-1 text-warn/80">/ {MIN_LENGTH} min</span>
                )}
              </div>
            </div>

            {/* Min-length hint */}
            <AnimatePresence>
              {belowMin && charCount > 0 && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-warn font-medium flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {MIN_LENGTH - charCount} more characters needed
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-2"
          >
            <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider block">
              Upload a file
            </label>

            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl border-2 border-dashed cursor-pointer
                transition-all duration-200 select-none
                ${isDragging
                  ? 'border-brand bg-brand/5 scale-[1.01]'
                  : file
                  ? 'border-success/50 bg-success/5'
                  : 'border-border hover:border-brand/40 hover:bg-brand/3 bg-white/50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.md,.json,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => { setFile(e.target.files[0] ?? null); setError(null); }}
                disabled={isSubmitting}
              />

              {file ? (
                <>
                  <FileText className="w-10 h-10 text-success" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-ink truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-ink-3 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 hover:bg-white border border-border text-ink-3 hover:text-danger transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    isDragging ? 'bg-ink/5' : 'bg-gray-100/80'
                  }`}>
                    <CloudUpload className={`w-7 h-7 transition-colors ${isDragging ? 'text-ink' : 'text-ink-3'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-ink">
                      {isDragging ? 'Drop it here' : 'Drag & drop a file'}
                    </p>
                    <p className="text-xs text-ink-3 mt-1">
                      or <span className="text-brand font-semibold">browse</span> — .txt, .csv, .md, .json, .pdf, .doc
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banners */}
      <AnimatePresence>
        {success && (
          <SuccessBanner
            chunkCount={success.chunkCount}
            onDismiss={() => setSuccess(null)}
          />
        )}
        {error && (
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
          />
        )}
      </AnimatePresence>

      {/* Submit */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-xs text-ink-3 hidden sm:block">
          Feedback is chunked, embedded, and stored for AI synthesis.
        </p>
        <button
          type="submit"
          disabled={isDisabled}
          className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95
            ${isDisabled
              ? 'bg-ink/10 text-ink-3 cursor-not-allowed'
              : 'bg-[#1a1d23] hover:bg-black text-white shadow-md shadow-black/10'
            }`}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
