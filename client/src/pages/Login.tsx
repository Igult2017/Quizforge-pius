// Login.tsx
import { useState } from "react";
import { auth, loginWithEmail, loginWithGoogle } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { Loader2, GraduationCap, Mail } from "lucide-react";
import { Link } from "wouter";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
  .font-inter { font-family: 'Inter', sans-serif; }
`;

const checkIsReturningUser = () => Math.random() < 0.7;

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-3" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M44.5 24.316c0-.853-.06-1.67-.18-2.463H24v4.664h11.834c-.517 2.583-2.008 4.773-4.502 6.27V38.11h6.096c3.56-3.284 5.61-8.1 5.61-13.794Z" fill="#4285F4"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M24 44.97c5.968 0 10.985-1.97 14.647-5.342l-6.096-4.72c-2.062 1.41-4.707 2.247-8.551 2.247-6.556 0-12.083-4.43-14.075-10.375H3.86v4.894C6.58 40.542 14.62 44.97 24 44.97Z" fill="#34A853"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M9.925 29.846c-.463-1.41-.727-2.91-.727-4.498 0-1.587.264-3.088.727-4.498V15.95H3.86C2.333 18.915 1.5 21.854 1.5 25.348c0 3.495.833 6.434 2.36 9.302l6.065-4.794Z" fill="#FBBC04"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M24 9.073c3.27 0 5.86.993 7.828 2.827l5.42-5.42C33.003 3.69 28.985 1.5 24 1.5c-9.38 0-17.42 4.43-20.14 11.458l6.065 4.794c1.992-5.945 7.519-10.375 14.075-10.375Z" fill="#EA4335"/>
  </svg>
);

export default function Login() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [isReturningUser] = useState(checkIsReturningUser());
  const welcomeText = isReturningUser 
    ? "Welcome back! Continue your exam prep journey."
    : "Sign in to start your exam prep journey.";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Login and get the user credential
      const credential = await loginWithEmail(email, password);
      const user = credential.user;
      if (!user) throw new Error("Firebase login failed: user not returned.");

      // Get ID token first
      const idToken = await user.getIdToken(true);

      // Check if user exists in our database (existing user check)
      let isExistingUser = false;
      try {
        const response = await fetch("/api/auth/user", {
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          // If we get a valid user response, they're an existing user
          isExistingUser = !!userData?.id;
          console.log("[Login] Existing user check:", { isExistingUser, userId: userData?.id });
        }
      } catch (dbError) {
        console.log("[Login] Could not check existing user, treating as new user");
        isExistingUser = false;
      }

      // Only enforce email verification for NEW users (not in database yet)
      if (!user.emailVerified && !isExistingUser) {
        console.log("[Login] New user without email verification - blocking login");
        
        // Show resend verification option
        setUnverifiedEmail(email);
        setShowResendVerification(true);
        
        // Sign out the user immediately
        await auth?.signOut();
        
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email address before logging in. Check your inbox for the verification link.",
          duration: 7000,
        });
        setIsLoading(false);
        return;
      }

      if (!user.emailVerified && isExistingUser) {
        console.log("[Login] Existing user without email verification - allowing login (grandfathered)");
      }

      // Update React Query with fresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const fetchUser = getQueryFn({ on401: "throw" });
      const freshUser = await fetchUser({ queryKey: ["/api/auth/user"] });
      queryClient.setQueryData(["/api/auth/user"], freshUser);

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      // Keep loading state while Router redirects based on auth state
      // The loading state will be cleared when component unmounts during navigation
    } catch (error: any) {
      console.error("Email login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      });
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    
    try {
      // Temporarily sign in to send verification email
      const credential = await loginWithEmail(unverifiedEmail, password);
      const user = credential.user;
      
      if (user) {
        await sendEmailVerification(user);
        // Sign out again
        await auth?.signOut();
        
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox and verify your email address.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send Email",
        description: error.message || "Please try again later",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const credential = await loginWithGoogle();
      const user = credential.user;
      if (!user) throw new Error("Google login failed: user not returned.");

      await user.getIdToken(true);

      // Update React Query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const fetchUser = getQueryFn({ on401: "throw" });
      const freshUser = await fetchUser({ queryKey: ["/api/auth/user"] });
      queryClient.setQueryData(["/api/auth/user"], freshUser);

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in with Google.",
      });

      // Keep loading state while Router redirects based on auth state
      // The loading state will be cleared when component unmounts during navigation
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Could not sign in with Google",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <div className="min-h-screen flex items-center justify-center p-4 bg-blue-700 relative overflow-hidden font-inter">
        <div className="w-full max-w-md z-10">
          <div className="text-center mb-10">
            <Link href="/" className="inline-block cursor-pointer group">
              <div className="flex items-center justify-center gap-3 mb-2 transition-opacity duration-200 group-hover:opacity-80">
                <GraduationCap className="h-12 w-12 text-white" />
                <h1 className="text-5xl font-extrabold text-white tracking-wider">NurseBrace</h1>
              </div>
            </Link>
            <p className="text-blue-100 text-lg font-light">{welcomeText}</p>
          </div>

          <Card className="rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-blue-300/50 border-t-4 border-blue-500 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pt-6 pb-4">
              <CardTitle className="text-3xl font-bold text-blue-700">Sign In</CardTitle>
              <CardDescription>Access your practice questions and track your progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                variant="outline"
                className="w-full h-12 text-base font-semibold border-gray-300 hover:border-blue-500 transition-colors flex items-center justify-center"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <>
                    <GoogleIcon />
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/95 px-2 text-gray-400 font-medium">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="focus:ring-blue-500 focus:border-blue-500 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="focus:ring-blue-500 focus:border-blue-500 h-10"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold shadow-md transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                </Button>
              </form>

              {showResendVerification && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Haven't received the verification email?
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        data-testid="button-resend-verification-login"
                      >
                        {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-500 pt-2">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-bold hover:underline">Sign up for free</Link>
              </div>

            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-blue-100 hover:text-white hover:underline">← Back to home</Link>
          </div>
        </div>
      </div>
    </>
  );
}


