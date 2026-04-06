import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'buildloop-workspace';
const S3_BASE_URL = process.env.AWS_S3_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

/**
 * Upload file to S3 bucket
 * Returns the S3 file path that can be used to retrieve the file later
 *
 * @param {Buffer} buffer - File content as Buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type (e.g., 'text/javascript', 'text/x-python')
 * @param {string} [projectId] - Optional project ID for organization in S3
 * @returns {Promise<{filePath: string, fileName: string, s3Key: string, fileSize: number}>}
 */
export async function uploadFile(buffer, fileName, mimeType, projectId = 'default') {
  if (!buffer || buffer.length === 0) {
    throw new Error('File buffer is empty');
  }

  if (!fileName) {
    throw new Error('File name is required');
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured in environment');
  }

  // Generate unique S3 key: projectId/timestamp-randomId-originalName
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString('hex');
  const s3Key = `${projectId}/${timestamp}-${randomId}-${fileName}`;

  console.log(`\x1b[33m[S3Upload] Uploading to S3: ${s3Key}\x1b[0m`);
  console.log(`\x1b[33m[S3Upload] File size: ${(buffer.length / 1024).toFixed(2)} KB\x1b[0m`);

  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        'original-file-name': fileName,
        'uploaded-at': new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);

    const filePath = `${S3_BASE_URL}/${s3Key}`;

    console.log(`\x1b[32m[S3Upload] Upload successful!\x1b[0m`);
    console.log(`\x1b[32m[S3Upload] File URL: ${filePath}\x1b[0m`);

    return {
      filePath,
      fileName,
      s3Key,
      fileSize: buffer.length,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`\x1b[31m[S3Upload] Upload failed: ${error.message}\x1b[0m`);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Get MIME type from file extension
 *
 * @param {string} fileName - File name with extension
 * @returns {string} MIME type
 */
export function getMimeType(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const mimeTypes = {
    js: 'text/javascript',
    jsx: 'text/jsx',
    ts: 'text/typescript',
    tsx: 'text/tsx',
    py: 'text/x-python',
    java: 'text/x-java',
    go: 'text/x-go',
    rs: 'text/x-rust',
    cpp: 'text/x-c++src',
    c: 'text/x-c',
    cs: 'text/x-csharp',
    rb: 'text/x-ruby',
    php: 'text/x-php',
    swift: 'text/x-swift',
    kt: 'text/x-kotlin',
    sql: 'text/x-sql',
    html: 'text/html',
    css: 'text/css',
    json: 'application/json',
    yaml: 'text/yaml',
    xml: 'text/xml',
    md: 'text/markdown',
  };

  return mimeTypes[ext] || 'text/plain';
}
