import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { Crown, Mail, UserCheck, UserX, XCircle, Send } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  hasUsedFreeTrial: boolean;
  isAdmin: boolean;
  adminGrantedAccess: boolean;
  adminAccessExpiresAt: string | null;
  hasActiveSubscription: boolean;
  subscription: {
    plan: string;
    endDate: string;
  } | null;
}

interface CurrentUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [accessDays, setAccessDays] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Check if current user is admin
  const { data: currentUser, isLoading: isCheckingAdmin } = useQuery<CurrentUser>({
    queryKey: ["/api/auth/me"],
  });

  // Redirect non-admins
  useEffect(() => {
    if (!isCheckingAdmin && currentUser && !currentUser.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [currentUser, isCheckingAdmin, setLocation, toast]);

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.isAdmin === true,
  });

  // Grant access mutation
  const grantAccessMutation = useMutation({
    mutationFn: async ({ userId, durationDays }: { userId: string; durationDays: number | null }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/grant-access`, { durationDays });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Access granted successfully",
      });
      setSelectedUser(null);
      setAccessDays("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to grant access",
        variant: "destructive",
      });
    },
  });

  // Revoke access mutation
  const revokeAccessMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/revoke-access`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Access revoked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive",
      });
    },
  });

  // End subscription mutation
  const endSubscriptionMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/end-subscription`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Subscription ended successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end subscription",
        variant: "destructive",
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ userId, subject, message }: { userId: string; subject: string; message: string }) => {
      return await apiRequest("POST", "/api/admin/email/send", { userId, subject, message });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      setSelectedUser(null);
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
  });

  // Broadcast email mutation
  const broadcastEmailMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      return await apiRequest("POST", "/api/admin/email/broadcast", { subject, message });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Broadcast email sent successfully",
      });
      setBroadcastSubject("");
      setBroadcastMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send broadcast email",
        variant: "destructive",
      });
    },
  });

  const handleGrantAccess = () => {
    if (selectedUser) {
      const days = accessDays ? parseInt(accessDays) : null;
      grantAccessMutation.mutate({ userId: selectedUser.id, durationDays: days });
    }
  };

  const handleSendEmail = () => {
    if (selectedUser && emailSubject && emailMessage) {
      sendEmailMutation.mutate({ userId: selectedUser.id, subject: emailSubject, message: emailMessage });
    }
  };

  const handleBroadcast = () => {
    if (broadcastSubject && broadcastMessage) {
      broadcastEmailMutation.mutate({ subject: broadcastSubject, message: broadcastMessage });
    }
  };

  if (isCheckingAdmin || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSignIn={() => setLocation("/login")} onGetStarted={() => setLocation("/signup")} />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin (will be redirected by useEffect)
  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSignIn={() => setLocation("/login")} onGetStarted={() => setLocation("/signup")} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        {/* Broadcast Email Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Marketing Email
            </CardTitle>
            <CardDescription>Send an email to all users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="broadcast-subject">Subject</Label>
              <Input
                id="broadcast-subject"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="Enter email subject"
                data-testid="input-broadcast-subject"
              />
            </div>
            <div>
              <Label htmlFor="broadcast-message">Message</Label>
              <Textarea
                id="broadcast-message"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter email message"
                rows={4}
                data-testid="textarea-broadcast-message"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleBroadcast}
              disabled={!broadcastSubject || !broadcastMessage || broadcastEmailMutation.isPending}
              data-testid="button-send-broadcast"
            >
              <Send className="h-4 w-4 mr-2" />
              {broadcastEmailMutation.isPending ? "Sending..." : "Send to All Users"}
            </Button>
          </CardFooter>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users?.length || 0})</CardTitle>
            <CardDescription>Manage user access and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Access</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {user.firstName || user.lastName
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : user.hasActiveSubscription ? (
                        <Badge variant="default">
                          {user.subscription?.plan} Plan
                        </Badge>
                      ) : user.hasUsedFreeTrial ? (
                        <Badge variant="secondary">Trial Used</Badge>
                      ) : (
                        <Badge variant="outline">Free Trial Available</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.adminGrantedAccess ? (
                        <Badge variant="default">
                          Granted
                          {user.adminAccessExpiresAt && (
                            <> until {new Date(user.adminAccessExpiresAt).toLocaleDateString()}</>
                          )}
                        </Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`button-grant-access-${user.id}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Grant Access</DialogTitle>
                              <DialogDescription>
                                Grant access to {user.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="access-days">Duration (days)</Label>
                                <Input
                                  id="access-days"
                                  type="number"
                                  value={accessDays}
                                  onChange={(e) => setAccessDays(e.target.value)}
                                  placeholder="Leave empty for permanent"
                                  data-testid="input-access-days"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleGrantAccess}
                                disabled={grantAccessMutation.isPending}
                                data-testid="button-confirm-grant-access"
                              >
                                {grantAccessMutation.isPending ? "Granting..." : "Grant Access"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {user.adminGrantedAccess && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeAccessMutation.mutate(user.id)}
                            disabled={revokeAccessMutation.isPending}
                            data-testid={`button-revoke-access-${user.id}`}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}

                        {user.hasActiveSubscription && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => endSubscriptionMutation.mutate(user.id)}
                            disabled={endSubscriptionMutation.isPending}
                            data-testid={`button-end-subscription-${user.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`button-send-email-${user.id}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Email</DialogTitle>
                              <DialogDescription>
                                Send email to {user.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="email-subject">Subject</Label>
                                <Input
                                  id="email-subject"
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                  placeholder="Enter subject"
                                  data-testid="input-email-subject"
                                />
                              </div>
                              <div>
                                <Label htmlFor="email-message">Message</Label>
                                <Textarea
                                  id="email-message"
                                  value={emailMessage}
                                  onChange={(e) => setEmailMessage(e.target.value)}
                                  placeholder="Enter message"
                                  rows={4}
                                  data-testid="textarea-email-message"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleSendEmail}
                                disabled={sendEmailMutation.isPending || !emailSubject || !emailMessage}
                                data-testid="button-confirm-send-email"
                              >
                                {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
