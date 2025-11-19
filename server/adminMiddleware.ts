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

    // HARDCODED ADMIN CHECK
    if (
      (normalizedEmail && HARDCODED_ADMIN_EMAILS.includes(normalizedEmail)) ||
      (!userEmail && HARDCODED_ADMIN_EMAILS.length === 1) // fallback if email missing
    ) {
      const emailToUse = normalizedEmail || HARDCODED_ADMIN_EMAILS[0];
      console.log(`[HARDCODED ADMIN] Allowing access for: ${emailToUse}`);

      // Ensure user exists in DB
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.getUserByEmail(emailToUse);
      }

      if (!user) {
        // Create/upsert user if none exists
        user = await storage.upsertUser({ id: userId, email: emailToUse });
      }

      // Ensure admin status
      if (!user.isAdmin) {
        console.log(`[HARDCODED ADMIN] Granting admin status in DB for: ${emailToUse}`);
        await storage.makeUserAdmin(user.id);
      }

      return next();
    }

    // Regular admin check for non-hardcoded users
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
