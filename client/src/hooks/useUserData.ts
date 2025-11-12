import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { queryClient, getQueryFn } from "@/lib/queryClient";

export interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  hasUsedFreeTrial: boolean;
  isAdmin?: boolean;
  subscription: {
    id: number;
    userId: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  hasActiveSubscription: boolean;
}

export function useUserData() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: userData, isLoading: userLoading, refetch } = useQuery<UserData | null>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  // Immediate admin detection from Firebase claims (if available)
  const isAdminFromClaims = (user as any)?.claims?.isAdmin || false;

  const resolvedUserData: UserData | null = {
    ...userData,
    isAdmin: isAdminFromClaims || userData?.isAdmin || false,
  } as UserData;

  return {
    userData: isAuthenticated ? resolvedUserData : null,
    isLoading: authLoading || userLoading,
    isAuthenticated,
    hasActiveSubscription: isAuthenticated && resolvedUserData?.hasActiveSubscription || false,
    hasUsedFreeTrial: isAuthenticated && resolvedUserData?.hasUsedFreeTrial || false,
    subscription: isAuthenticated ? resolvedUserData?.subscription || null : null,
    refetch,
  };
}

