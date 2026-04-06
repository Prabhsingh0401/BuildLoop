import { Router } from 'express';
import multer from 'multer';
import { Workspace } from '../models/workspace.model.js';
import { ingestWorkspaceFile } from '../services/workspaceIngestion.service.js';
import { uploadFile, getMimeType } from '../lib/storage.js';

const router = Router();

// Configure multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/workspace/:projectId/upload
 * Upload a code file:
 * 1. Save original file to S3
 * 2. Chunk it (600 lines), embed, and upsert to Pinecone + MongoDB
 */
router.post('/:projectId/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.auth?.userId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Use multipart/form-data with "file" field.'
      });
    }

    console.log(`\n[Upload] Received file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Step 1: Upload original file to S3
    const mimeType = getMimeType(req.file.originalname);
    const s3Result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      mimeType,
      projectId
    );
    console.log(`[Upload] S3 upload complete: ${s3Result.s3Key}`);

    // Step 2: Call the ingestion service (chunk, embed, upsert to Pinecone, save to MongoDB)
    const result = await ingestWorkspaceFile({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      projectId,
      userId: userId || 'system'
    });

    res.status(201).json({
      success: true,
      data: {
        documentId: result.documentId,
        fileName: req.file.originalname,
        language: result.language,
        chunkCount: result.chunkCount,
        s3Path: s3Result.filePath,
        s3Key: s3Result.s3Key,
        message: `File uploaded to S3 and processed: ${result.chunkCount} chunks created and embedded.`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/workspace/:projectId
 * Lists all uploaded files for a project with metadata
 * Returns: fileName, language, and chunk count (NOT rawContent)
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required.'
      });
    }

    const files = await Workspace.find({ projectId })
      .select('fileName language chunks createdAt updatedAt')
      .sort({ createdAt: -1 });

    const filesWithMetadata = files.map(file => ({
      _id: file._id,
      fileName: file.fileName,
      language: file.language,
      chunkCount: file.chunks ? file.chunks.length : 0,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    }));

    res.json({
      success: true,
      data: filesWithMetadata
    });
  } catch (error) {
    next(error);
  }
});

export default router;
