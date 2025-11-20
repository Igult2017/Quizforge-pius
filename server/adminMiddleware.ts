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
      console.log("[ADMIN CHECK] No user or claims found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    const normalizedEmail = userEmail?.toLowerCase().trim();

    console.log(`[ADMIN CHECK] Checking admin status for: ${userEmail} (UID: ${userId})`);

    // Check if user is the first Firebase user (automatic admin)
    const isFirstUser = await isFirstFirebaseUser(userId);
    
    console.log(`[ADMIN CHECK] isFirstUser result: ${isFirstUser}`);
    
    if (isFirstUser === true) {
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

      console.log(`[ADMIN CHECK] ✅ First user admin access granted`);
      return next();
    }

    // If first user detection failed (null), fallback to database check
    if (isFirstUser === null) {
      console.warn(`[ADMIN CHECK] ⚠️ First user detection failed - checking database`);
    }

    // Regular admin check (database)
    let user = await storage.getUser(userId);

    if (!user && normalizedEmail) {
      user = await storage.getUserByEmail(normalizedEmail);
    }

    console.log(`[ADMIN CHECK] User found in DB: ${user ? 'Yes' : 'No'}, isAdmin: ${user?.isAdmin || false}`);

    if (!user || !user.isAdmin) {
      console.log(`[ADMIN CHECK] ❌ Access denied - not admin`);
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    console.log(`[ADMIN CHECK] ✅ Database admin access granted`);
    next();
  } catch (error) {
    console.error("[ADMIN CHECK] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
