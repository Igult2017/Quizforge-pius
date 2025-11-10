import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let previousUser: User | null = null;

    try {
      unsubscribe = onAuthChange((firebaseUser) => {
        const wasAuthenticated = previousUser !== null;
        const isNowAuthenticated = firebaseUser !== null;
        
        setUser(firebaseUser);
        setIsLoading(false);
        
        // When logging in, invalidate to force fresh user data fetch
        if (!wasAuthenticated && isNowAuthenticated) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }
        
        // When logging out, reset the query to clear cached data
        if (wasAuthenticated && !isNowAuthenticated) {
          queryClient.resetQueries({ queryKey: ["/api/auth/user"] });
        }
        
        // Update previous user for next comparison
        previousUser = firebaseUser;
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
