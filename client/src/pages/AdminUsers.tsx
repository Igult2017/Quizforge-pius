import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, UserCheck, UserX, XCircle, Ban, Clock, Users, CreditCard, TestTube, ShieldAlert, Shield, ShieldOff, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nclexFreeTrialUsed: boolean;
  teasFreeTrialUsed: boolean;
  hesiFreeTrialUsed: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  adminGrantedAccess: boolean;
  adminAccessExpiresAt: string | null;
  hasActiveSubscription: boolean;
  hasAnySubscription: boolean;
  subscription: {
    id: number;
    plan: string;
    endDate: string;
  } | null;
  allSubscriptions: Array<{
    id: number;
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [accessDays, setAccessDays] = useState("");
  const [extendDays, setExtendDays] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkEmailDialogOpen, setIsBulkEmailDialogOpen] = useState(false);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    switch (activeTab) {
      case "subscribers":
        return users.filter(u => u.hasAnySubscription && !u.isAdmin);
      case "trial":
        // Show users who haven't used ANY free trial yet
        return users.filter(u => !u.hasAnySubscription && !u.nclexFreeTrialUsed && !u.teasFreeTrialUsed && !u.hesiFreeTrialUsed && !u.isAdmin);
      case "banned":
        return users.filter(u => u.isBanned && !u.isAdmin);
      default:
        return users;
    }
  }, [users, activeTab]);

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

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User banned successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User unbanned successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    },
  });

  const extendSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/extend-subscription`, { days });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Subscription modified successfully",
      });
      setSelectedUser(null);
      setExtendDays("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to modify subscription",
        variant: "destructive",
      });
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/make-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User is now an admin",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to make user admin",
        variant: "destructive",
      });
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/revoke-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Admin status revoked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke admin status",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const sendBulkEmailMutation = useMutation({
    mutationFn: async (data: { emails: string[]; subject: string; message: string }) => {
      return await apiRequest("POST", "/api/admin/bulk-email", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully sent ${data.sentCount} emails`,
      });
      setIsBulkEmailDialogOpen(false);
      setEmailSubject("");
      setEmailMessage("");
      setSelectedUserIds([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk emails",
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

  const handleExtendSubscription = () => {
    if (selectedUser && extendDays) {
      const days = parseInt(extendDays);
      extendSubscriptionMutation.mutate({ userId: selectedUser.id, days });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleSendBulkEmail = () => {
    const selectedEmails = filteredUsers
      .filter(u => selectedUserIds.includes(u.id) && u.email)
      .map(u => u.email!);

    if (selectedEmails.length > 0 && emailSubject && emailMessage) {
      sendBulkEmailMutation.mutate({
        emails: selectedEmails,
        subject: emailSubject,
        message: emailMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  const subscribersCount = users?.filter(u => u.hasActiveSubscription).length || 0;
  const trialCount = users?.filter(u => !u.hasActiveSubscription && !u.nclexFreeTrialUsed && !u.teasFreeTrialUsed && !u.hesiFreeTrialUsed && !u.isAdmin).length || 0;
  const bannedCount = users?.filter(u => u.isBanned).length || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage user access and subscriptions</p>
        </div>
        {selectedUserIds.length > 0 && (
          <Dialog open={isBulkEmailDialogOpen} onOpenChange={setIsBulkEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Send Email to {selectedUserIds.length} users
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Bulk Email</DialogTitle>
                <DialogDescription>
                  This email will be sent to {selectedUserIds.length} selected users.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-subject">Subject</Label>
                  <Input
                    id="bulk-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-message">Message</Label>
                  <Textarea
                    id="bulk-message"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter email message"
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBulkEmail}
                  disabled={sendBulkEmailMutation.isPending || !emailSubject || !emailMessage}
                >
                  {sendBulkEmailMutation.isPending ? "Sending..." : "Send Emails"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList data-testid="tabs-user-filter">
          <TabsTrigger value="all" className="gap-2" data-testid="tab-all-users">
            <Users className="h-4 w-4" />
            All Users ({users?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2" data-testid="tab-subscribers">
            <CreditCard className="h-4 w-4" />
            Subscribers ({subscribersCount})
          </TabsTrigger>
          <TabsTrigger value="trial" className="gap-2" data-testid="tab-trial">
            <TestTube className="h-4 w-4" />
            Trial Available ({trialCount})
          </TabsTrigger>
          <TabsTrigger value="banned" className="gap-2" data-testid="tab-banned">
            <ShieldAlert className="h-4 w-4" />
            Banned ({bannedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && `All Users (${filteredUsers.length})`}
                {activeTab === "subscribers" && `Active Subscribers (${filteredUsers.length})`}
                {activeTab === "trial" && `Users with Trial Available (${filteredUsers.length})`}
                {activeTab === "banned" && `Banned Users (${filteredUsers.length})`}
              </CardTitle>
              <CardDescription>
                {activeTab === "subscribers" && "Users with active paid subscriptions"}
                {activeTab === "trial" && "Users who haven't used their free trial yet"}
                {activeTab === "banned" && "Users who have been banned from the platform"}
                {activeTab === "all" && "All registered users"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleAllSelection}
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Access</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      aria-label={`Select user ${user.email}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {user.isBanned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {user.isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : user.hasActiveSubscription ? (
                        <Badge variant="default">
                          {user.subscription?.plan} Plan
                        </Badge>
                      ) : (user.nclexFreeTrialUsed && user.teasFreeTrialUsed && user.hesiFreeTrialUsed) ? (
                        <Badge variant="secondary">All Trials Used</Badge>
                      ) : (
                        <Badge variant="outline">
                          Trial: {!user.nclexFreeTrialUsed ? 'N' : ''}{!user.teasFreeTrialUsed ? 'T' : ''}{!user.hesiFreeTrialUsed ? 'H' : ''}
                        </Badge>
                      )}
                    </div>
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

                      {!user.isAdmin ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`button-make-admin-${user.id}`}
                              title="Make this user an admin"
                            >
                              <Shield className="h-4 w-4 text-green-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent onCloseAutoFocus={() => setSelectedUser(null)}>
                            <DialogHeader>
                              <DialogTitle>Make User Admin</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to grant admin privileges to {selectedUser?.email}? 
                                This will give them full access to the admin panel and all administrative functions.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                                data-testid="button-cancel-make-admin"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  if (selectedUser?.id) {
                                    makeAdminMutation.mutate(selectedUser.id);
                                  }
                                  setSelectedUser(null);
                                }}
                                disabled={makeAdminMutation.isPending || !selectedUser}
                                data-testid="button-confirm-make-admin"
                              >
                                {makeAdminMutation.isPending ? "Processing..." : "Make Admin"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              disabled={!currentUser || currentUser.id === user.id}
                              data-testid={`button-revoke-admin-${user.id}`}
                              title={!currentUser ? "Loading..." : currentUser.id === user.id ? "You cannot revoke your own admin status" : "Revoke admin status"}
                            >
                              <ShieldOff className="h-4 w-4 text-orange-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent onCloseAutoFocus={() => setSelectedUser(null)}>
                            <DialogHeader>
                              <DialogTitle>Revoke Admin Status</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to revoke admin privileges from {selectedUser?.email}?
                                They will lose access to the admin panel and all administrative functions.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                                data-testid="button-cancel-revoke-admin"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  if (selectedUser?.id) {
                                    revokeAdminMutation.mutate(selectedUser.id);
                                  }
                                  setSelectedUser(null);
                                }}
                                disabled={revokeAdminMutation.isPending || !selectedUser}
                                data-testid="button-confirm-revoke-admin"
                              >
                                {revokeAdminMutation.isPending ? "Processing..." : "Revoke Admin"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      {user.hasActiveSubscription && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => endSubscriptionMutation.mutate(user.id)}
                            disabled={endSubscriptionMutation.isPending}
                            data-testid={`button-end-subscription-${user.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`button-extend-subscription-${user.id}`}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Extend/Reduce Subscription</DialogTitle>
                                <DialogDescription>
                                  Modify subscription duration for {user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="extend-days">Days to Add/Remove</Label>
                                  <Input
                                    id="extend-days"
                                    type="number"
                                    value={extendDays}
                                    onChange={(e) => setExtendDays(e.target.value)}
                                    placeholder="Positive to extend, negative to reduce"
                                    data-testid="input-extend-days"
                                  />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Current end date: {user.subscription?.endDate ? new Date(user.subscription.endDate).toLocaleDateString() : "N/A"}
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleExtendSubscription}
                                  disabled={extendSubscriptionMutation.isPending || !extendDays}
                                  data-testid="button-confirm-extend-subscription"
                                >
                                  {extendSubscriptionMutation.isPending ? "Updating..." : "Update Duration"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {user.isBanned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unbanUserMutation.mutate(user.id)}
                          disabled={unbanUserMutation.isPending}
                          data-testid={`button-unban-${user.id}`}
                        >
                          <Ban className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : !user.isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => banUserMutation.mutate(user.id)}
                          disabled={banUserMutation.isPending}
                          data-testid={`button-ban-${user.id}`}
                        >
                          <Ban className="h-4 w-4 text-red-600" />
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

                      {currentUser?.id !== user.id && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete {user.email}? This action cannot be undone. All user data including quiz history, subscriptions, and payments will be permanently removed.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="destructive"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                                data-testid="button-confirm-delete-user"
                              >
                                {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
