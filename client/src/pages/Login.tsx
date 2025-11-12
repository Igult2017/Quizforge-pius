// Login.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loginWithEmail, loginWithGoogle } from "@/lib/firebase";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { Loader2, GraduationCap } from "lucide-react";
import { Link } from "wouter";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
  .font-inter {
    font-family: 'Inter', sans-serif;
  }
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReturningUser] = useState(checkIsReturningUser());
  const welcomeText = isReturningUser 
    ? "Welcome back! Continue your exam prep journey."
    : "Sign in to start your exam prep journey.";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginWithEmail(email, password);
      if (!user) throw new Error("Firebase login failed: no user returned.");

      // Ensure token is ready
      await user.getIdToken(true);

      // Invalidate and immediately fetch user query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const fetchUser = getQueryFn({ on401: "throw" });
      const freshUser = await fetchUser({ queryKey: ["/api/auth/user"] });
      queryClient.setQueryData(["/api/auth/user"], freshUser);

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      setLocation("/"); // redirect to authenticated route
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (!user) throw new Error("Google login failed: no user returned.");

      // Ensure token is ready
      await user.getIdToken(true);

      // Invalidate and immediately fetch user query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const fetchUser = getQueryFn({ on401: "throw" });
      const freshUser = await fetchUser({ queryKey: ["/api/auth/user"] });
      queryClient.setQueryData(["/api/auth/user"], freshUser);

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in with Google.",
      });

      setLocation("/"); // redirect to authenticated route
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

