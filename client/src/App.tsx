import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Categories from "@/pages/Categories";
import Admin from "@/pages/Admin";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userData, isLoading: userDataLoading } = useUserData();

  // Wait for both authentication and user data to load
  if (authLoading || userDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not authenticated, show public routes
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/:rest*" component={Landing} />
      </Switch>
    );
  }

  // User is authenticated, redirect based on role
  const isAdmin = userData?.isAdmin || false;

  return (
    <Switch>
      <Route path="/">
        {isAdmin ? <Redirect to="/admin" /> : <Redirect to="/categories" />}
      </Route>
      <Route path="/categories" component={Categories} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/users" component={Admin} />
      <Route path="/admin/marketing" component={Admin} />
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

