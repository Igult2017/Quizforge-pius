import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { queryClient, getQueryFn } from "@/lib/queryClient";

export interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  nclexFreeTrialUsed: boolean;
  teasFreeTrialUsed: boolean;
  hesiFreeTrialUsed: boolean;
  isAdmin?: boolean;
  adminGrantedAccess?: boolean;
  adminAccessExpiresAt?: string | null;
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

export interface CategoryProgress {
  answered: number;
  total: number;
  percentage: number;
}

export interface ProgressData {
  NCLEX: CategoryProgress;
  TEAS: CategoryProgress;
  HESI: CategoryProgress;
}

export function useUserData() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: userData, isLoading: userLoading, refetch } = useQuery<UserData | null>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  // Fetch progress data
  const { data: progressData, isLoading: progressLoading, refetch: refetchProgress } = useQuery<ProgressData>({
    queryKey: ["/api/auth/user/progress"],
    enabled: isAuthenticated,
  });

  // Admin status is determined entirely by the backend
  // The first Firebase user is automatically granted admin access
  // Client-side simply displays the admin status returned from the backend

  // DEBUG: Log admin detection info
  console.log("[ADMIN DETECTION]", {
    rawEmail: (user as any)?.email || userData?.email,
    userEmail: ((user as any)?.email || userData?.email)?.toLowerCase().trim(),
    isAdminFromClaims: false, // Claims are not set by backend, always false
    userDataIsAdmin: userData?.isAdmin,
  });

  // The backend determines admin status - we just use what it returns
  const resolvedUserData: UserData | null = isAuthenticated 
    ? {
        ...(userData || {}),
        isAdmin: userData?.isAdmin || false,
      } as UserData
    : null;

  if (resolvedUserData && resolvedUserData.isAdmin) {
    console.log("[RESOLVED USER DATA]", {
      email: resolvedUserData.email,
      isAdmin: true,
    });
  }

  // Check if ALL category free trials have been used
  const allFreeTrialsUsed = isAuthenticated && resolvedUserData
    ? resolvedUserData.nclexFreeTrialUsed && 
      resolvedUserData.teasFreeTrialUsed && 
      resolvedUserData.hesiFreeTrialUsed
    : false;

  return {
    userData: resolvedUserData,
    isLoading: authLoading || userLoading,
    isAuthenticated,
    hasActiveSubscription: isAuthenticated && resolvedUserData?.hasActiveSubscription || false,
    nclexFreeTrialUsed: isAuthenticated && resolvedUserData?.nclexFreeTrialUsed || false,
    teasFreeTrialUsed: isAuthenticated && resolvedUserData?.teasFreeTrialUsed || false,
    hesiFreeTrialUsed: isAuthenticated && resolvedUserData?.hesiFreeTrialUsed || false,
    allFreeTrialsUsed,
    subscription: isAuthenticated ? resolvedUserData?.subscription || null : null,
    progressData: progressData || null,
    progressLoading,
    refetch: async () => {
      await refetch();
      await refetchProgress();
    },
  };
}

