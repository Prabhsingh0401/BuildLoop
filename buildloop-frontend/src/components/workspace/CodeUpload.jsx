import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileCode, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CodeUpload({ onUpload, isUploading, uploadError, files = [] }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const MAX_FILES = 10;
  const ALLOWED_EXTENSIONS = [
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'cs', 'rb', 
    'php', 'swift', 'kt', 'sql', 'html', 'css', 'json', 'yaml', 'xml', 'md'
  ];

  const isFileAllowed = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFiles = async (filesToProcess) => {
    // Validate file count
    if (filesToProcess.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed at once`);
      return;
    }

    // Validate file types
    const invalidFiles = filesToProcess.filter(f => !isFileAllowed(f.name));
    if (invalidFiles.length > 0) {
      alert(`Invalid file types. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Start uploading
    const fileNames = filesToProcess.map(f => f.name);
    setUploadingFiles(fileNames);

    for (const file of filesToProcess) {
      try {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 10
        }));

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Call the onUpload callback
        await onUpload(formData);

        // Mark complete
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));

        // Remove from uploading list after delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f !== file.name));
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 1500);

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadingFiles(prev => prev.filter(f => f !== file.name));
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  };

  const handleFileInputChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    await processFiles(selectedFiles);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drag-and-drop zone */}
      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        animate={isDragActive ? { scale: 0.98 } : { scale: 1 }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDragActive ? 'bg-blue-100' : 'bg-gray-200'
          }`}>
            <Upload className={`w-6 h-6 ${
              isDragActive ? 'text-blue-600' : 'text-gray-600'
            }`} />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-black">
              Drop code files here
            </p>
            <p className="text-xs text-gray-600 mt-1">
              or click to browse (max {MAX_FILES} files)
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Supported: {ALLOWED_EXTENSIONS.slice(0, 5).join(', ')}...
          </p>
        </div>
      </motion.div>

      {/* Upload error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-300 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-600">{uploadError?.message || uploadError || 'Upload failed'}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading files progress */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadingFiles.map(fileName => (
              <motion.div
                key={fileName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-gray-50 border border-gray-300 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  <p className="text-xs text-black truncate flex-1">{fileName}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress[fileName] || 0}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    transition={{ type: 'tween', duration: 0.3 }}
                  />
                </div>

                <p className="text-xs text-gray-600 mt-1 text-right">
                  {uploadProgress[fileName] || 0}%
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 border border-gray-300 rounded-lg p-4"
        >
          <p className="text-xs font-semibold text-black mb-3">
            Uploaded Files ({files.length})
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file) => (
              <motion.div
                key={file._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-2.5 bg-white hover:bg-gray-100 rounded-lg transition-colors group border border-gray-200"
              >
                <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-black truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {file.language} • {file.chunkCount} chunks
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state text */}
      {files.length === 0 && uploadingFiles.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          No files uploaded yet
        </p>
      )}
    </div>
  );
}
