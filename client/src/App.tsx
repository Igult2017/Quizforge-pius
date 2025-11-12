import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import Quiz from "@/pages/Quiz";
import Results from "@/pages/Results";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import Checkout from "@/pages/Checkout";
import PostPaymentSignup from "@/pages/PostPaymentSignup";
import Admin from "@/pages/Admin";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userData, isLoading: userLoading } = useUserData();

  // Wait for both authentication and user data
  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated: show public routes
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/post-payment-signup" component={PostPaymentSignup} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/contact" component={Contact} />
        <Route path="/:rest*" component={Landing} />
      </Switch>
    );
  }

  // Authenticated: redirect based on role
  const isAdmin = userData?.isAdmin || false;

  return (
    <Switch>
      <Route path="/">
        {isAdmin ? <Redirect to="/admin" /> : <Redirect to="/categories" />}
      </Route>
      <Route path="/categories" component={Categories} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/checkout" component={Checkout} />
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

