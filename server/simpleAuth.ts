import { Request, Response, NextFunction } from "express";

// Simple session storage (in production, use Redis or similar)
const activeSessions = new Set<string>();

export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function validateAdminToken(token: string): boolean {
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  
  if (!adminToken) {
    console.warn("⚠️  ADMIN_ACCESS_TOKEN not set. Admin access is disabled.");
    return false;
  }
  
  return token === adminToken;
}

export function createSession(token: string): string {
  if (validateAdminToken(token)) {
    const sessionToken = generateSessionToken();
    activeSessions.add(sessionToken);
    return sessionToken;
  }
  throw new Error("Invalid admin token");
}

export function validateSession(sessionToken: string): boolean {
  return activeSessions.has(sessionToken);
}

export function deleteSession(sessionToken: string): void {
  activeSessions.delete(sessionToken);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check for session token in cookie or header
  const sessionToken = req.cookies?.adminSession || req.header("X-Admin-Session");
  
  if (!sessionToken || !validateSession(sessionToken)) {
    return res.status(401).json({ 
      error: "Unauthorized",
      message: "Admin access required. Please log in."
    });
  }
  
  next();
}

export function optionalAdmin(req: Request, res: Response, next: NextFunction) {
  // Check for session token but don't require it
  const sessionToken = req.cookies?.adminSession || req.header("X-Admin-Session");
  
  if (sessionToken && validateSession(sessionToken)) {
    (req as any).isAdmin = true;
  }
  
  next();
}
