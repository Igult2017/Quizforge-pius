// useAuth.ts
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase";
import { queryClient, getQueryFn } from "@/lib/queryClient";

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

        // Update React state immediately for UI
        setUser(firebaseUser);
        setIsLoading(false);

        // Handle login
        if (!wasAuthenticated && isNowAuthenticated) {
          // Fetch fresh ID token, then update user query
          firebaseUser?.getIdToken(true)
            .then(async () => {
              // Invalidate cached query to refetch user data
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

              // Optional enhancement: fetch the user immediately and update cache
              try {
                const fetchUser = getQueryFn({ on401: "returnNull" });
                const freshUser = await fetchUser({ queryKey: ["/api/auth/user"] });
                queryClient.setQueryData(["/api/auth/user"], freshUser);
              } catch (fetchError) {
                console.error("Error fetching fresh user data:", fetchError);
              }
            })
            .catch((tokenError) => {
              console.error("Error fetching Firebase ID token:", tokenError);
            });
        }

        // Handle logout
        if (wasAuthenticated && !isNowAuthenticated) {
          queryClient.resetQueries({ queryKey: ["/api/auth/user"] });
        }

        previousUser = firebaseUser;
      });
    } catch (error: any) {
      console.warn("Firebase authentication not configured:", error.message);
      setFirebaseError(error.message);
      setIsLoading(false);
    }

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
