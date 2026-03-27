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
