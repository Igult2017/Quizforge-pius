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

function initializeFirebase(): FirebaseApp {
  if (!app) {
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API key is not configured. Please set VITE_FIREBASE_API_KEY environment variable.");
    }
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

function getAuthInstance(): Auth {
  if (!authInstance) {
    const firebaseApp = initializeFirebase();
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
}

export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    return getAuthInstance()[prop as keyof Auth];
  }
});

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signupWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
