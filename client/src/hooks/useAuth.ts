import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase";
import { queryClient, getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const previousUserRef = useRef<User | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthChange(async (firebaseUser) => {
        const previousUser = previousUserRef.current;
        const wasAuthenticated = previousUser !== null;
        const isNowAuthenticated = firebaseUser !== null;

        console.log("[AuthChange] Triggered:", {
          wasAuthenticated,
          isNowAuthenticated,
          firebaseUserEmail: firebaseUser?.email || "none",
        });

        if (firebaseUser) {
          try {
            // Ensure we have a valid token before updating state
            const token = await firebaseUser.getIdToken(true);
            console.log("[Auth] Token refreshed successfully:", token ? "✅" : "❌");

            // Update React state
            setUser(firebaseUser);
            setIsLoading(false);

            // Invalidate & refetch user info
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

            try {
              const fetchUser = getQueryFn({ on401: "returnNull" });
              const freshUser = await fetchUser({ queryKey: ["/api/auth/user"] });
              queryClient.setQueryData(["/api/auth/user"], freshUser);
              console.log("[Auth] User data refreshed:", freshUser);
            } catch (fetchError) {
              console.error("[Auth] Failed to fetch fresh user data:", fetchError);
            }
          } catch (tokenError: any) {
            console.error("[Auth] Failed to get ID token:", tokenError);
            setFirebaseError(tokenError.message || "Failed to refresh token");
            setIsLoading(false);
          }
        } else {
          // Handle logout
          console.log("[Auth] User logged out or null");
          setUser(null);
          queryClient.resetQueries({ queryKey: ["/api/auth/user"] });
          setIsLoading(false);
        }

        // Track previous state
        previousUserRef.current = firebaseUser;
      });
    } catch (error: any) {
      console.error("[Auth] Firebase authentication error:", error);
      setFirebaseError(error.message || "Firebase not configured");
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    firebaseError,
  };
}
