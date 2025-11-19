import admin from "firebase-admin";
import type { RequestHandler } from "express";

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App;

try {
  // Use environment variable for project ID, fallback to hardcoded value for local dev
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "quizeforge-44a83";
  
  // Initialize with service account if provided, otherwise use default credentials
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    // Parse service account JSON from environment variable
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
      console.log("Firebase Admin initialized with service account");
    } catch (parseError) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", parseError);
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY: must be valid JSON service account key");
    }
  } else {
    // Use Application Default Credentials (works in Google Cloud, or with GOOGLE_APPLICATION_CREDENTIALS env var)
    // This will work automatically in production environments like Google Cloud, Cloud Run, etc.
    // For local development, you can set GOOGLE_APPLICATION_CREDENTIALS to point to a service account key file
    try {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId,
      });
      console.log(`Firebase Admin initialized with Application Default Credentials for project: ${projectId}`);
    } catch (credError) {
      // In production (NODE_ENV=production), we require proper Firebase credentials
      // This ensures authentication works reliably and fails fast if misconfigured
      if (process.env.NODE_ENV === 'production') {
        console.error("=".repeat(80));
        console.error("FATAL ERROR: Firebase Admin credentials not configured for production");
        console.error("Firebase authentication will not work without proper credentials.");
        console.error("");
        console.error("Please configure one of the following:");
        console.error("  1. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable with JSON service account");
        console.error("  2. Set GOOGLE_APPLICATION_CREDENTIALS pointing to service account file");
        console.error("  3. Deploy on a platform with automatic Application Default Credentials (GCP, Cloud Run)");
        console.error("");
        console.error("Get service account from: Firebase Console → Project Settings → Service Accounts");
        console.error("=".repeat(80));
        throw new Error("Firebase Admin credentials required for production deployment");
      }
      
      // For development, allow initialization without credentials (will work for most token verification)
      console.warn("=".repeat(80));
      console.warn("WARNING: Firebase Admin initializing without credentials (development mode)");
      console.warn("This may work for basic auth but is NOT recommended for production");
      console.warn("Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS for full functionality");
      console.warn("=".repeat(80));
      firebaseAdmin = admin.initializeApp({
        projectId: projectId,
      });
      console.log(`Firebase Admin initialized with project ID only (development mode): ${projectId}`);
    }
  }
} catch (error: any) {
  if (error.code === "app/duplicate-app") {
    firebaseAdmin = admin.app();
    console.log("Firebase Admin already initialized");
  } else {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

// Middleware to verify Firebase ID tokens
export const verifyFirebaseToken: RequestHandler = async (req: any, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Attach user info to request (matching Replit Auth format)
      req.user = {
        claims: {
          sub: decodedToken.uid,
          email: decodedToken.email,
          first_name: decodedToken.name?.split(" ")[0] || "",
          last_name: decodedToken.name?.split(" ").slice(1).join(" ") || "",
        },
      };
      
      next();
    } catch (error: any) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
};

// Combined middleware that accepts either Firebase or Replit Auth
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Check if user already authenticated via Replit Auth
  if (req.user && req.user.claims && req.user.claims.sub) {
    return next();
  }

  // Try Firebase token authentication
  return verifyFirebaseToken(req, res, next);
};

/**
 * Get the first Firebase user (the admin)
 * Returns the UID of the first user created in Firebase Auth
 * 
 * This function first checks the database for a persisted first user UID.
 * If not found, it queries Firebase Auth to find the first user and persists it.
 */
export async function getFirstFirebaseUserUid(): Promise<string | null> {
  try {
    const { storage } = await import("./storage");
    
    // Check if we have a persisted first user UID
    const persistedUid = await storage.getSystemSetting("first_firebase_user_uid");
    if (persistedUid) {
      console.log(`[FIREBASE ADMIN] Using persisted first user UID: ${persistedUid}`);
      return persistedUid;
    }

    console.log("[FIREBASE ADMIN] No persisted first user UID found, querying Firebase Auth...");

    // List all users with pagination to find the first one
    let allUsers: admin.auth.UserRecord[] = [];
    let pageToken: string | undefined;
    
    try {
      do {
        console.log(`[FIREBASE ADMIN] Fetching users page... (current total: ${allUsers.length})`);
        const listUsersResult = await admin.auth().listUsers(1000, pageToken);
        allUsers = allUsers.concat(listUsersResult.users);
        pageToken = listUsersResult.pageToken;
      } while (pageToken);
      
      console.log(`[FIREBASE ADMIN] Total Firebase users found: ${allUsers.length}`);
    } catch (listError: any) {
      console.error("[FIREBASE ADMIN] Failed to list Firebase users:", listError.message);
      console.error("[FIREBASE ADMIN] This likely means Firebase Admin credentials are not properly configured");
      console.error("[FIREBASE ADMIN] Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable");
      return null;
    }
    
    if (allUsers.length === 0) {
      console.log("[FIREBASE ADMIN] No users found in Firebase Auth");
      return null;
    }

    // Log all users with their creation times for debugging
    console.log("[FIREBASE ADMIN] All Firebase users by creation time:");
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - Created: ${user.metadata.creationTime} (UID: ${user.uid})`);
    });

    // Sort users by creation time to find the first one
    const sortedUsers = allUsers.sort((a, b) => {
      const timeA = new Date(a.metadata.creationTime).getTime();
      const timeB = new Date(b.metadata.creationTime).getTime();
      return timeA - timeB;
    });

    const firstUser = sortedUsers[0];
    console.log(`[FIREBASE ADMIN] ═══════════════════════════════════════════════════════`);
    console.log(`[FIREBASE ADMIN] FIRST FIREBASE USER (by creation time):`);
    console.log(`[FIREBASE ADMIN]   Email: ${firstUser.email}`);
    console.log(`[FIREBASE ADMIN]   UID: ${firstUser.uid}`);
    console.log(`[FIREBASE ADMIN]   Created: ${firstUser.metadata.creationTime}`);
    console.log(`[FIREBASE ADMIN] ═══════════════════════════════════════════════════════`);
    
    // Persist the first user UID to prevent it from changing
    await storage.setSystemSetting("first_firebase_user_uid", firstUser.uid);
    console.log(`[FIREBASE ADMIN] First Firebase user UID persisted to database`);
    
    return firstUser.uid;
  } catch (error) {
    console.error("[FIREBASE ADMIN] Error getting first user:", error);
    return null;
  }
}

/**
 * Check if a user ID is the first Firebase user (admin)
 * Returns true if user is the first Firebase user, false if not, null if detection failed
 */
export async function isFirstFirebaseUser(userId: string): Promise<boolean | null> {
  const firstUserUid = await getFirstFirebaseUserUid();
  if (firstUserUid === null) {
    return null; // Detection failed - credentials not configured
  }
  return firstUserUid === userId;
}
