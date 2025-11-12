import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useUserData } from "./hooks/useUserData";
import Loader2 from "./components/Loader2";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import PostPaymentSignup from "./pages/PostPaymentSignup";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Categories from "./pages/Categories";
import Quiz from "./pages/Quiz";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

function Router() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { userData, isLoading: userLoading } = useUserData();

  // Wait for auth or user data
  const isLoading = authLoading || userLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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

  const isAdmin = userData?.isAdmin || false;

  if (isAdmin) {
    return <Redirect to="/admin" />;
  }

  return (
    <Switch>
      <Route path="/" component={Categories} />
      <Route path="/categories" component={Categories} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

// ✅ Default export so main.tsx can import without braces
export default Router;

