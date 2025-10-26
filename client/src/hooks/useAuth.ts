import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, isFetching } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Keep loading state true until we have a definitive answer (user or null)
  const isStillLoading = isLoading || (isFetching && user === undefined);

  return {
    user,
    isLoading: isStillLoading,
    isAuthenticated: user !== null && user !== undefined,
  };
}
