import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

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
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: userData, isLoading: userLoading, refetch } = useQuery<UserData | null>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  return {
    userData,
    isLoading: authLoading || userLoading,
    isAuthenticated,
    hasActiveSubscription: userData?.hasActiveSubscription || false,
    hasUsedFreeTrial: userData?.hasUsedFreeTrial || false,
    subscription: userData?.subscription || null,
    refetch,
  };
}
