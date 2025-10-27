import admin from "firebase-admin";
import type { RequestHandler } from "express";

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App;

try {
  firebaseAdmin = admin.initializeApp({
    projectId: "quizeforge-44a83",
  });
  console.log("Firebase Admin initialized");
} catch (error: any) {
  if (error.code === "app/duplicate-app") {
    firebaseAdmin = admin.app();
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
