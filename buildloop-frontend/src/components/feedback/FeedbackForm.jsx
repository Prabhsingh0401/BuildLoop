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
import IntegrationButtons from './IntegrationButtons';

const MIN_LENGTH = 100;

const MODE_TABS = [
  { id: 'paste', label: 'Paste', icon: MessageSquareText },
  { id: 'file',  label: 'File', icon: Upload },
];

const CARD_BASE = 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

function SuccessBanner({ chunkCount, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-xl"
    >
      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-success">Submitted! Split into {chunkCount} chunk{chunkCount !== 1 ? 's' : ''}</p>
      </div>
      <button onClick={onDismiss} className="text-success/50 hover:text-success p-0.5" aria-label="Dismiss">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-xl"
    >
      <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-danger">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-danger/50 hover:text-danger p-0.5" aria-label="Dismiss">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

import { useFeedback } from '@/hooks/useFeedback';

export default function FeedbackForm() {
  const [mode, setMode] = useState('paste');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const { submitFeedback, isSubmitting } = useFeedback();
  const fileInputRef = useRef(null);

  const charCount = text.length;
  const belowMin = mode === 'paste' && charCount < MIN_LENGTH;
  const isDisabled = isSubmitting || (mode === 'paste' ? belowMin : !file);

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

    try {
      const res = await submitFeedback({ rawText, source: mode, metaType: 'other' });
      const chunkCount = res.data?.chunkCount ?? res.data?.chunks?.length ?? res.data?.pineconeIds?.length ?? 0;
      setSuccess({ chunkCount });
      setText('');
      setFile(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
    <form onSubmit={handleSubmit} className={`${CARD_BASE} p-4 space-y-3`} noValidate>
      {/* Compact Header with Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-white/40 backdrop-blur-md rounded-xl p-0.5 border border-white/40">
          {MODE_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMode(id); setError(null); setSuccess(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === id ? 'text-ink bg-white shadow-sm border border-black/5' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Char counter for paste mode */}
        {mode === 'paste' && (
          <span className={`text-xs font-medium tabular-nums ${belowMin && charCount > 0 ? 'text-warn' : 'text-ink-3'}`}>
            {charCount}/{MIN_LENGTH}
          </span>
        )}
      </div>

      {/* Input Area - Compact */}
      <AnimatePresence mode="wait">
        {mode === 'paste' ? (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="relative">
              <textarea
                id="feedback-textarea"
                value={text}
                onChange={(e) => { setText(e.target.value); setError(null); }}
                rows={3}
                placeholder="Paste survey responses, interview notes, support tickets..."
                className={`w-full resize-none bg-white/80 border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:ring-2 transition-all
                  ${belowMin && charCount > 0 ? 'border-warn/50 focus:ring-warn/20 focus:border-warn/60' : 'border-border focus:ring-brand/20 focus:border-brand/40'}`}
                disabled={isSubmitting}
              />
            </div>
            <AnimatePresence>
              {belowMin && charCount > 0 && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[10px] text-warn font-medium flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {MIN_LENGTH - charCount} more characters needed
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging ? 'border-brand bg-brand/5' : file ? 'border-success/50 bg-success/5' : 'border-border hover:border-brand/40 hover:bg-brand/3 bg-white/50'
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
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-success" />
                    <p className="text-sm font-medium text-ink truncate max-w-[200px]">{file.name}</p>
                  </div>
                  <p className="text-xs text-ink-3">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="absolute top-2 right-2 p-1 rounded bg-white/80 hover:bg-white border border-border text-ink-3 hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <CloudUpload className="w-6 h-6 text-ink-3" />
                  <p className="text-xs font-medium text-ink">Drop file or click to browse</p>
                  <p className="text-[10px] text-ink-3">.txt, .csv, .md, .json, .pdf</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banners - Compact */}
      <AnimatePresence>
        {success && (
          <SuccessBanner chunkCount={success.chunkCount} onDismiss={() => setSuccess(null)} />
        )}
        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-ink-3">Feedback is chunked, embedded, and stored for AI synthesis.</p>
        <button
          type="submit"
          disabled={isDisabled}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            isDisabled ? 'bg-ink/10 text-ink-3 cursor-not-allowed' : 'bg-[#1a1d23] hover:bg-black text-white shadow-md'
          }`}
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
    
    <div className={CARD_BASE + " p-4"}>
      {/* Integration Buttons - Now compact */}
      <IntegrationButtons />
    </div>
    </div>
  );
}
