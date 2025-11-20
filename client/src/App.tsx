import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth";
import { useUserData } from "./hooks/useUserData";
import { TawkToChat } from "./components/TawkToChat";

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
import Admin from "./pages/Admin";
import NotFound from "./pages/not-found";

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userData, isLoading: userLoading } = useUserData();

  const isLoading = authLoading || userLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Unauthenticated routes
  if (!isAuthenticated) {
    return (
      <>
        <TawkToChat />
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/post-payment-signup" component={PostPaymentSignup} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/contact" component={Contact} />
          <Route component={Landing} />
        </Switch>
      </>
    );
  }

  // Authenticated user routes
  const isAdmin = userData?.isAdmin || false;

  return (
    <>
      <TawkToChat />
      <Switch>
        {/* Admin routes */}
        <Route path="/admin/:rest*" component={Admin} />
        <Route path="/admin" component={Admin} />

      {/* User routes */}
      <Route path="/">
        {isAdmin ? <Redirect to="/admin" /> : <Categories />}
      </Route>
      <Route path="/categories" component={Categories} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/checkout" component={Checkout} />

      {/* Redirect login/signup for authenticated users */}
      <Route path="/login">
        <Redirect to={isAdmin ? "/admin" : "/categories"} />
      </Route>
      <Route path="/signup">
        <Redirect to={isAdmin ? "/admin" : "/categories"} />
      </Route>

      <Route component={NotFound} />
    </Switch>
    </>
  );
}

export default App;

