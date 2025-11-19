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
import Admin from "./pages/Admin";
import NotFound from "./pages/not-found";

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
  // Authenticated user (Admin or Regular)
  // -------------------------------------
  const isAdmin = userData?.isAdmin || false;

  return (
    <Switch>
      {/* Admin routes - accessible by admins */}
      <Route path="/admin">
        <Admin />
      </Route>
      <Route path="/admin/:rest*">
        <Admin />
      </Route>

      {/* Normal user routes - accessible by all authenticated users (including admins) */}
      <Route path="/">
        {isAdmin ? <Redirect to="/admin" /> : <Categories />}
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

      {/* Redirect login/signup routes for authenticated users */}
      <Route path="/login">
        <Redirect to={isAdmin ? "/admin" : "/categories"} />
      </Route>
      <Route path="/signup">
        <Redirect to={isAdmin ? "/admin" : "/categories"} />
      </Route>

      {/* Catch-all - show 404 for truly missing routes */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default App;

