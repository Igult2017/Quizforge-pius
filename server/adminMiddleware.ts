import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

/**
 * Middleware to check if user is an admin
 * Must be used after isAuthenticated middleware
 */
export async function isAdmin(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.claims || !req.user.claims.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    
    let user = await storage.getUser(userId);
    
    // Fallback to email lookup for legacy users
    if (!user && userEmail) {
      user = await storage.getUserByEmail(userEmail);
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
