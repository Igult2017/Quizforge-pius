import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminQuestions from "./AdminQuestions";
import AdminMarketing from "./AdminMarketing";
import { Menu, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { UserData } from "@/hooks/useUserData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { data: userData, isLoading, error } = useQuery<UserData | null>({
    queryKey: ["/api/auth/user"],
  });
  
  // If not authenticated (userData is null and not loading), redirect to sign in
  useEffect(() => {
    if (!isLoading && userData === null) {
      console.log("[Admin] User not authenticated, redirecting to sign-in");
      setLocation("/sign-in");
    }
  }, [isLoading, userData, setLocation]);

  const handleInitializeFirstAdmin = async () => {
    setIsInitializing(true);
    try {
      const response = await apiRequest("POST", "/api/admin/initialize-first-admin", {});
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success!",
          description: data.message || "You are now an admin.",
        });
        
        // Refresh user data to get the updated isAdmin status
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        toast({
          variant: "destructive",
          title: "Initialization Failed",
          description: data.message || data.error || "Could not initialize admin status.",
        });
      }
    } catch (error: any) {
      console.error("Error initializing admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to initialize admin status.",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loader-admin" />
      </div>
    );
  }

  // Show admin access denied for non-admin users who ARE authenticated
  if (!userData?.isAdmin) {
    console.log("[Admin] User authenticated but not admin. Email:", userData?.email);
    return (
      <div className="flex items-center justify-center h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <CardDescription>
              You need administrator privileges to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Contact an existing administrator to grant you admin privileges.
            </p>
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => setLocation("/")}
              data-testid="button-back-to-app"
            >
              Back to Home
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
