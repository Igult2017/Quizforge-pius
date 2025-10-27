import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminMarketing from "./AdminMarketing";
import { Menu, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { UserData } from "@/hooks/useUserData";

export default function Admin() {
  const [, setLocation] = useLocation();
  
  const { data: userData, isLoading } = useQuery<UserData | null>({
    queryKey: ["/api/auth/user"],
  });

  // Redirect non-admins
  useEffect(() => {
    if (!isLoading && userData && !userData.isAdmin) {
      setLocation("/categories");
    }
  }, [userData, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loader-admin" />
      </div>
    );
  }

  if (!userData?.isAdmin) {
    return null;
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
              <Route path="/admin/marketing" component={AdminMarketing} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
