import { createClerkClient } from '@clerk/backend';

let clerk = null;

const getClerkClient = () => {
  if (!clerk) {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error('Missing CLERK_SECRET_KEY environment variable');
    }
    clerk = createClerkClient({ secretKey: clerkSecretKey });
  }
  return clerk;
};

/**
 * Middleware to verify Clerk Bearer token from Authorization header
 * Attaches userId to req.auth
 */
export const verifyClerkAuth = async (req, res, next) => {
  try {
    const clerkClient = getClerkClient();
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      // Allow requests without auth header to proceed (protect specific routes with requireAuth)
      req.auth = null;
      return next();
    }

    // Verify the token with Clerk
    const decoded = await clerkClient.verifyToken(token);

    // Attach userId to request object
    req.auth = {
      userId: decoded.sub,
      sessionId: decoded.sid,
      orgId: decoded.org_id || null
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    // Don't fail on auth error - let individual routes decide
    req.auth = null;
    next();
  }
};

/**
 * Middleware to require authentication
 * Should be used after verifyClerkAuth
 */
export const requireAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};
