import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const { userData, isLoading: userLoading, refetch } = useUserData();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    } else if (!userLoading && userData?.phone) {
      setLocation("/categories");
    }
  }, [isAuthenticated, authLoading, userData, userLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 7) {
      toast({
        variant: "destructive",
        title: "Invalid Phone",
        description: "Please enter a valid phone number",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/update-phone", { 
        userId: userData?.id, 
        phone 
      });
      await refetch();
      toast({
        title: "Profile Updated",
        description: "Thank you! Your profile is now complete.",
      });
      setLocation("/categories");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Could not update phone number",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#2442FF]">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 antialiased" style={{backgroundColor: '#2442FF'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-10 w-10 text-white" />
            <h1 className="text-4xl font-extrabold text-white tracking-tight">NurseBrace</h1>
          </div>
        </div>

        <Card className="shadow-2xl border-t-4 border-white/70 rounded-xl">
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl font-bold text-gray-800">Complete Your Profile</CardTitle>
            <CardDescription className="text-base text-gray-500 font-bold">
              Please provide your phone number to continue. This is required for account security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., +1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#2442FF] text-white hover:bg-blue-700 h-11 transition duration-150 shadow-md hover:shadow-lg font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Complete Signup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
