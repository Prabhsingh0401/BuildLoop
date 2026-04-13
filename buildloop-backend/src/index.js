import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import router from './routes/index.js';
import { connectDB } from './lib/mongo.js';
import { verifyClerkAuth, requireAuth } from './middleware/auth.middleware.js';

dotenv.config();

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDB();

    const app = express();

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check - public endpoint
    app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    // Protected API routes - verify and enforce Clerk authentication
    app.use('/api', verifyClerkAuth, requireAuth);

    // Routes
    app.use('/api', router);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    const PORT = parseInt(process.env.PORT || '5000', 10);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
