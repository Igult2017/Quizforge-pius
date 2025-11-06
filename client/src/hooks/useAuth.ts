import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthChange((firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
      });
    } catch (error: any) {
      console.warn("Firebase authentication not configured:", error.message);
      setFirebaseError(error.message);
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    firebaseError,
  };
}
