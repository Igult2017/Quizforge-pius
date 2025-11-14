import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth";
import { useUserData } from "./hooks/useUserData";

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
import NotFound from "./pages/not-found"; // updated import to match actual file

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userData, isLoading: userLoading } = useUserData();

  const isLoading = authLoading || userLoading;

  // -------------------------------------
  // Loading state
  // -------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* Tailwind spinner */}
        <div className="h-12 w-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  // -------------------------------------
  // Unauthenticated routes
  // -------------------------------------
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/">
          <Landing />
        </Route>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/signup">
          <Signup />
        </Route>
        <Route path="/checkout">
          <Checkout />
        </Route>
        <Route path="/post-payment-signup">
          <PostPaymentSignup />
        </Route>
        <Route path="/pricing">
          <Pricing />
        </Route>
        <Route path="/contact">
          <Contact />
        </Route>
        {/* Catch-all */}
        <Route>
          <Landing />
        </Route>
      </Switch>
    );
  }

  // -------------------------------------
  // Authenticated user
  // -------------------------------------
  const isAdmin = userData?.isAdmin || false;

  if (isAdmin) {
    return <Redirect to="/admin" />;
  }

  // -------------------------------------
  // Normal user routes
  // -------------------------------------
  return (
    <Switch>
      <Route path="/">
        <Categories />
      </Route>
      <Route path="/categories">
        <Categories />
      </Route>
      <Route path="/quiz">
        <Quiz />
      </Route>
      <Route path="/results">
        <Results />
      </Route>
      <Route path="/pricing">
        <Pricing />
      </Route>
      <Route path="/contact">
        <Contact />
      </Route>
      <Route path="/checkout">
        <Checkout />
      </Route>
      {/* Catch-all */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default App;

