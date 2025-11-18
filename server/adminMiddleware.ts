import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Hardcoded admin emails - these users ALWAYS have admin access
const HARDCODED_ADMIN_EMAILS = [
  "antiperotieno@zohomail.com"
];

/**
 * Middleware to check if user is an admin
 * Must be used after isAuthenticated middleware
 * HARDCODED: Emails in HARDCODED_ADMIN_EMAILS always have admin access
 */
export async function isAdmin(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.claims || !req.user.claims.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    const normalizedEmail = userEmail?.toLowerCase().trim();
    
    // HARDCODED ADMIN CHECK: Always allow hardcoded admin emails
    if (normalizedEmail && HARDCODED_ADMIN_EMAILS.includes(normalizedEmail)) {
      console.log(`[HARDCODED ADMIN] Allowing access for: ${userEmail}`);
      
      // Ensure admin status in database
      let user = await storage.getUser(userId);
      if (!user && normalizedEmail) {
        user = await storage.getUserByEmail(normalizedEmail);
      }
      
      if (user && !user.isAdmin) {
        console.log(`[HARDCODED ADMIN] Granting admin status in DB for: ${userEmail}`);
        await storage.makeUserAdmin(user.id);
      }
      
      return next();
    }
    
    let user = await storage.getUser(userId);
    
    // Fallback to email lookup for legacy users
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
