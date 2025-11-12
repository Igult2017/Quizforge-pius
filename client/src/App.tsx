function Router() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { userData, isLoading: userLoading } = useUserData();

  // Wait for auth state or user data to determine role
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

  // Determine role
  const isAdmin = userData?.isAdmin || false;

  // Immediately redirect admin users
  if (isAdmin) {
    return <Redirect to="/admin" />;
  }

  // Normal users go to categories
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

