import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  type Auth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC3gq2n4MY35qxhKZHMQU20AFck5NKA7aU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "quizeforge-44a83.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quizeforge-44a83",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "quizeforge-44a83.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "997024322375",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:997024322375:web:a54247e484f7f2468df262",
};

console.log("[FIREBASE DEBUG] Config loaded:", {
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeySource: import.meta.env.VITE_FIREBASE_API_KEY ? "env" : "hardcoded",
  projectId: firebaseConfig.projectId,
});

// Lazy Firebase initialization
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
const isFirebaseConfigured = !!firebaseConfig.apiKey;

console.log("[FIREBASE DEBUG] isFirebaseConfigured:", isFirebaseConfigured);

function initializeFirebase(): FirebaseApp | null {
  if (!isFirebaseConfigured) {
    console.warn("Firebase API key is not configured. Authentication will not work.");
    return null;
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

function getAuthInstance(): Auth | null {
  if (!isFirebaseConfigured) {
    return null;
  }
  if (!authInstance) {
    const firebaseApp = initializeFirebase();
    if (firebaseApp) {
      authInstance = getAuth(firebaseApp);
    }
  }
  return authInstance;
}

// Export a getter function instead of the instance directly
export const getAuthSafe = (): Auth | null => getAuthInstance();
export const auth = getAuthInstance(); // Keep for backward compatibility
export const firebaseEnabled = isFirebaseConfigured;

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions with better error handling
export const loginWithEmail = async (email: string, password: string) => {
  const authInstance = getAuthSafe();
  if (!authInstance) {
    throw new Error("Firebase is not configured");
  }
  try {
    console.log("[Firebase] Attempting login with email:", email);
    const result = await signInWithEmailAndPassword(authInstance, email, password);
    console.log("[Firebase] Login successful:", result.user.email);
    return result;
  } catch (error: any) {
    console.error("[Firebase] Login error:", error.code, error.message);
    throw error;
  }
};

export const signupWithEmail = async (email: string, password: string) => {
  const authInstance = getAuthSafe();
  if (!authInstance) {
    throw new Error("Firebase is not configured");
  }
  try {
    console.log("[Firebase] Attempting signup with email:", email);
    const result = await createUserWithEmailAndPassword(authInstance, email, password);
    console.log("[Firebase] Signup successful:", result.user.email);
    
    // Send verification email to new users
    try {
      await sendEmailVerification(result.user);
      console.log("[Firebase] Verification email sent to:", result.user.email);
    } catch (verificationError: any) {
      console.error("[Firebase] Failed to send verification email:", verificationError.message);
      // Don't throw - allow user to continue even if email fails
    }
    
    return result;
  } catch (error: any) {
    console.error("[Firebase] Signup error:", error.code, error.message);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  const authInstance = getAuthSafe();
  if (!authInstance) {
    throw new Error("Firebase is not configured");
  }
  try {
    console.log("[Firebase] Attempting Google login");
    const result = await signInWithPopup(authInstance, googleProvider);
    console.log("[Firebase] Google login successful:", result.user.email);
    return result;
  } catch (error: any) {
    console.error("[Firebase] Google login error:", error.code, error.message);
    throw error;
  }
};

export const logout = async () => {
  const authInstance = getAuthSafe();
  if (!authInstance) {
    throw new Error("Firebase is not configured");
  }
  return signOut(authInstance);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  const authInstance = getAuthSafe();
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, callback);
};

export const resendVerificationEmail = async () => {
  const authInstance = getAuthSafe();
  if (!authInstance) {
    throw new Error("Firebase is not configured");
  }
  
  const user = authInstance.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in");
  }
  
  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }
  
  try {
    await sendEmailVerification(user);
    console.log("[Firebase] Verification email resent to:", user.email);
  } catch (error: any) {
    console.error("[Firebase] Failed to resend verification email:", error.message);
    throw error;
  }
};

export const checkEmailVerified = async (): Promise<boolean> => {
  const authInstance = getAuthSafe();
  if (!authInstance) {
    return false;
  }
  
  const user = authInstance.currentUser;
  if (!user) {
    return false;
  }
  
  // Reload user to get latest verification status
  await user.reload();
  return user.emailVerified;
};

