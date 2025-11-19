import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { isFirstFirebaseUser } from "./firebaseAuth";

/**
 * Middleware to check if user is an admin
 * Must be used after isAuthenticated middleware
 * The first user in Firebase Auth is automatically granted admin access
 */
export async function isAdmin(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.claims || !req.user.claims.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    const normalizedEmail = userEmail?.toLowerCase().trim();

    // Check if user is the first Firebase user (automatic admin)
    const isFirstUser = await isFirstFirebaseUser(userId);
    
    if (isFirstUser) {
      console.log(`[FIREBASE ADMIN] First Firebase user detected: ${userEmail} (UID: ${userId})`);

      // Ensure user exists in DB
      let user = await storage.getUser(userId);
      if (!user && normalizedEmail) {
        user = await storage.getUserByEmail(normalizedEmail);
      }

      if (!user) {
        // Create user if none exists
        user = await storage.upsertUser({ 
          id: userId, 
          email: normalizedEmail || null,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
        });
      }

      // Ensure admin status in database
      if (!user.isAdmin) {
        console.log(`[FIREBASE ADMIN] Granting admin status to first Firebase user: ${userEmail}`);
        await storage.makeUserAdmin(user.id);
      }

      return next();
    }

    // Regular admin check for non-first users
    let user = await storage.getUser(userId);

    if (!user && normalizedEmail) {
      user = await storage.getUserByEmail(normalizedEmail);
    }

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
