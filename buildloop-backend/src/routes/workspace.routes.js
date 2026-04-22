import { Router } from "express";
import multer from "multer";

import { askWorkspace } from "../services/workspace.service.js";
import { Workspace } from "../models/workspace.model.js";
import { ingestWorkspaceFile } from "../services/workspaceIngestion.service.js";
import { uploadFile, getMimeType } from "../lib/storage.js";

const router = Router();

// Multer Config (for file upload)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/workspace/ask
 * Chat with workspace (WITH HISTORY)
 */
router.post("/ask", async (req, res, next) => {
  try {
    const { question, projectId, messages = [], activeRepo } = req.body;

    // ✅ Safe validation
    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "messages must be an array",
      });
    }

    const safeQuestion = question.trim();

    const { answer, citations } = await askWorkspace({
      projectId,
      question: safeQuestion,
      messages,
      activeRepo,
    });

    // ✅ Consistent success response
    res.json({
      success: true,
      data: {
        answer,
        citations,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/workspace/:projectId/upload
 * Upload + S3 + Chunk + Embed + Store
 */
router.post(
  "/:projectId/upload",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const userId = req.auth?.userId;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "projectId is required.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            'No file provided. Use multipart/form-data with "file" field.',
        });
      }

      console.log(
        `\n[Upload] Received file: ${req.file.originalname} (${req.file.size} bytes)`
      );

      // Step 1: Upload to S3
      const mimeType = getMimeType(req.file.originalname);

      const s3Result = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        mimeType,
        projectId
      );

      console.log(`[Upload] S3 upload complete: ${s3Result.s3Key}`);

      // Step 2: Ingest (chunk + embed + pinecone + mongo)
      const result = await ingestWorkspaceFile({
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        projectId,
        userId: userId || "system",
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
          message: `File uploaded and processed: ${result.chunkCount} chunks embedded.`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * GET /api/workspace/:projectId
 * List all uploaded files
 */
router.get("/:projectId", async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required.",
      });
    }

    const files = await Workspace.find({ projectId })
      .select("fileName language chunks createdAt updatedAt")
      .sort({ createdAt: -1 });

    const filesWithMetadata = files.map((file) => ({
      _id: file._id,
      fileName: file.fileName,
      language: file.language,
      chunkCount: file.chunks ? file.chunks.length : 0,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));

    res.json({
      success: true,
      data: filesWithMetadata,
    });
  } catch (error) {
    next(error);
  }
});

export default router;