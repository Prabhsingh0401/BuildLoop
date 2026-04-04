/**
 * Splits text into chunks based on sentence boundaries, keeping each chunk
 * under approximately 512 tokens.
 *
 * @param {string} text - The input text to chunk.
 * @returns {string[]} An array of text chunks.
 */
export function chunkText(text) {
  if (!text || typeof text !== 'string') return [];

  // Approximate tokens to characters (1 token ≈ 4 characters)
  const MAX_TOKENS = 512;
  const AVG_CHARS_PER_TOKEN = 4;
  const MAX_CHARS_PER_CHUNK = MAX_TOKENS * AVG_CHARS_PER_TOKEN;

  // Split into sentences using a regex that handles common punctuation
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [];

  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // If adding this sentence to the current chunk would exceed the limit
    if ((currentChunk + ' ' + trimmedSentence).length > MAX_CHARS_PER_CHUNK) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedSentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${trimmedSentence}` : trimmedSentence;
    }
  }

  // Push the final chunk if it exists
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Detects programming language from file extension
 * @param {string} fileName - The file name or path
 * @returns {string} The detected language
 */
function detectLanguage(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    xml: 'xml',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
  };

  return languageMap[ext] || 'plaintext';
}

/**
 * Splits code content into chunks of maximum 600 lines each with metadata
 *
 * Each chunk includes:
 * - fileName: the original file name
 * - language: detected programming language
 * - startLine: starting line number (1-indexed)
 * - endLine: ending line number (1-indexed)
 * - totalLines: total number of lines in the file
 *
 * @param {string} content - The code content to chunk
 * @param {string} fileName - The file name (used for language detection)
 * @returns {string[]} An array of code chunks with metadata headers
 */
export function codeChunker(content, fileName) {
  if (!content || typeof content !== 'string') return [];

  const MAX_LINES_PER_CHUNK = 600;
  const language = detectLanguage(fileName);

  // Split content into lines, preserving empty lines
  const lines = content.split('\n');
  const totalLines = lines.length;

  const chunks = [];

  // Process content in 600-line chunks
  for (let i = 0; i < lines.length; i += MAX_LINES_PER_CHUNK) {
    const chunkLines = lines.slice(i, i + MAX_LINES_PER_CHUNK);
    const startLine = i + 1;
    const endLine = i + chunkLines.length;

    // Create metadata header
    const metadata = [
      `[FILE] ${fileName}`,
      `[LANGUAGE] ${language}`,
      `[LINES] ${startLine}-${endLine} (total: ${totalLines})`,
      '---',
    ];

    // Combine metadata with chunk content
    const chunk = [...metadata, ...chunkLines].join('\n');
    chunks.push(chunk);
  }

  return chunks;
}
