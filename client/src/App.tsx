import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth";
import { useUserData } from "./hooks/useUserData";
import { useAutoLogout } from "./hooks/useAutoLogout";
import { TawkToChat } from "./components/TawkToChat";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import PostPaymentSignup from "./pages/PostPaymentSignup";
import CompleteProfile from "./pages/CompleteProfile";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Exams from "./pages/Exams";
import About from "./pages/About";
import Categories from "./pages/Categories";
import TopicSelection from "./pages/TopicSelection";
import Performance from "./pages/Performance";
import Quiz from "./pages/Quiz";
import Results from "./pages/Results";
import Admin from "./pages/Admin";
import NotFound from "./pages/not-found";

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userData, isLoading: userLoading } = useUserData();
  
  // Auto-logout after 10 minutes of inactivity
  useAutoLogout(isAuthenticated);

  const isLoading = authLoading || userLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-700">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
        </div>
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
          <Route path="/exams" component={Exams} />
          <Route path="/about" component={About} />
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
      <Route path="/topic-selection" component={TopicSelection} />
      <Route path="/performance" component={Performance} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/exams" component={Exams} />
      <Route path="/about" component={About} />
      <Route path="/checkout" component={Checkout} />

      {/* Admin routes */}
      <Route path="/admin/:rest*" component={Admin} />
      <Route path="/admin" component={Admin} />

      {/* Redirect login/signup for authenticated users */}
      <Route path="/login">
        {isAdmin ? <Redirect to="/admin" /> : <Redirect to="/categories" />}
      </Route>
      <Route path="/signup">
        {isAdmin ? <Redirect to="/admin" /> : <Redirect to="/categories" />}
      </Route>

      {/* Fallback for authenticated users */}
      <Route path="/:rest*">
        <Redirect to={isAdmin ? "/admin" : "/categories"} />
      </Route>
    </Switch>
    </>
  );
}

export default App;

