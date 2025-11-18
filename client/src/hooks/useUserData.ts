import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { queryClient, getQueryFn } from "@/lib/queryClient";

// Hardcoded admin emails - these users ALWAYS have admin access
const HARDCODED_ADMIN_EMAILS = [
  "antiperotieno@zohomail.com"
];

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

  // HARDCODED ADMIN CHECK: Check if email is in hardcoded admin list
  const rawEmail = (user as any)?.email || userData?.email;
  const userEmail = rawEmail?.toLowerCase().trim();
  const isHardcodedAdmin = userEmail && HARDCODED_ADMIN_EMAILS.includes(userEmail);
  
  // Immediate admin detection from Firebase claims (if available)
  const isAdminFromClaims = (user as any)?.claims?.isAdmin || false;

  // DEBUG: Log all admin detection info
  console.log("[ADMIN DETECTION]", {
    rawEmail,
    userEmail,
    isHardcodedAdmin,
    isAdminFromClaims,
    userDataIsAdmin: userData?.isAdmin,
    isAuthenticated,
    hasUserData: !!userData,
    HARDCODED_ADMIN_EMAILS,
  });

  // Priority order: Hardcoded admin > Claims > Database
  // Guard against undefined userData to prevent runtime crash
  const resolvedUserData: UserData | null = isAuthenticated 
    ? {
        ...(userData || {}),
        isAdmin: isHardcodedAdmin || isAdminFromClaims || userData?.isAdmin || false,
      } as UserData
    : null;

  if (isHardcodedAdmin) {
    console.log(`[HARDCODED ADMIN] Frontend detected admin: ${userEmail}`);
  }

  if (resolvedUserData) {
    console.log("[RESOLVED USER DATA]", {
      email: resolvedUserData.email,
      isAdmin: resolvedUserData.isAdmin,
    });
  }

  return {
    userData: resolvedUserData,
    isLoading: authLoading || userLoading,
    isAuthenticated,
    hasActiveSubscription: isAuthenticated && resolvedUserData?.hasActiveSubscription || false,
    hasUsedFreeTrial: isAuthenticated && resolvedUserData?.hasUsedFreeTrial || false,
    subscription: isAuthenticated ? resolvedUserData?.subscription || null : null,
    refetch,
  };
}

