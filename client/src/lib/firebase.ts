import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  type Auth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "quizeforge-44a83.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quizeforge-44a83",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "quizeforge-44a83.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "997024322375",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:997024322375:web:a54247e484f7f2468df262",
};

// Lazy Firebase initialization
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
const isFirebaseConfigured = !!firebaseConfig.apiKey;

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

// Export the auth instance (may be null if not configured)
export const auth = getAuthInstance();
export const firebaseEnabled = isFirebaseConfigured;

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const loginWithEmail = (email: string, password: string) => {
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured"));
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const signupWithEmail = (email: string, password: string) => {
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured"));
  }
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = () => {
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured"));
  }
  return signInWithPopup(auth, googleProvider);
};

export const logout = () => {
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured"));
  }
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

