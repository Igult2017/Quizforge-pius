import React from "react";
import { Switch, Route } from "wouter";

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
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/post-payment-signup" component={PostPaymentSignup} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      
      {/* Quiz routes */}
      <Route path="/categories" component={Categories} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />

      {/* Admin routes */}
      <Route path="/admin/:rest*" component={Admin} />
      <Route path="/admin" component={Admin} />

      {/* Catch-all - 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;

