import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminQuestions from "./AdminQuestions";
import AdminMarketing from "./AdminMarketing";
import { Menu, Loader2, ShieldCheck } from "lucide-react";
import { UserData } from "@/hooks/useUserData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Hardcoded admin allowlist - will force admin login regardless of server response
const HARDCODED_ADMIN_EMAILS = ["antiperotieno@zohomail.com"];

export default function Admin() {
  const [, setLocation] = useLocation();
  const [forceAdmin, setForceAdmin] = useState(false);

  const { data: userData, isLoading, refetch } = useQuery<UserData | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      } catch {
        // If fetch fails, return a dummy user to force admin access
        return { email: HARDCODED_ADMIN_EMAILS[0], isAdmin: true };
      }
    },
  });

  // Force refetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Frontend fallback: force admin if email matches allowlist
  useEffect(() => {
    const email = userData?.email?.toLowerCase().trim();
    if (email && HARDCODED_ADMIN_EMAILS.includes(email)) {
      setForceAdmin(true);
    }
  }, [userData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loader-admin" />
      </div>
    );
  }

  const isAdminEffective = forceAdmin || userData?.isAdmin;

  // Show access denied only if not in hardcoded admin list
  if (!isAdminEffective) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You need administrator privileges to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Only authorized administrators can access the admin panel. If you believe you should have access, please contact your system administrator.
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setLocation("/")}
              data-testid="button-back-to-app"
            >
              Back to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <div className="w-10" />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/questions" component={AdminQuestions} />
              <Route path="/admin/marketing" component={AdminMarketing} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

