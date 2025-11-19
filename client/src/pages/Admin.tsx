import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminQuestions from "./AdminQuestions";
import AdminGeneration from "./AdminGeneration";
import AdminMarketing from "./AdminMarketing";
import { Menu, Loader2, ShieldCheck } from "lucide-react";
import { UserData } from "@/hooks/useUserData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [, setLocation] = useLocation();
  
  const { data: userData, isLoading } = useQuery<UserData | null>({
    queryKey: ["/api/auth/user"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loader-admin" />
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!userData?.isAdmin) {
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
              <Route path="/admin/generation" component={AdminGeneration} />
              <Route path="/admin/marketing" component={AdminMarketing} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
