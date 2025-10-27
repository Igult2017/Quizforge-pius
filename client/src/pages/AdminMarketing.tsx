import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, CheckSquare, Square } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  hasActiveSubscription: boolean;
  isAdmin: boolean;
  subscription: {
    plan: string;
  } | null;
}

export default function AdminMarketing() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ userIds, subject, message }: { userIds: string[]; subject: string; message: string }) => {
      // Send email to each selected user
      const promises = userIds.map(userId => 
        apiRequest("POST", "/api/admin/email/send", { userId, subject, message })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Email sent to ${variables.userIds.length} user(s)`,
      });
      setSubject("");
      setMessage("");
      setSelectedUserIds(new Set());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send emails",
        variant: "destructive",
      });
    },
  });

  const broadcastEmailMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      return await apiRequest("POST", "/api/admin/email/broadcast", { subject, message });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Broadcast email sent to all users",
      });
      setSubject("");
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send broadcast email",
        variant: "destructive",
      });
    },
  });

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAll = () => {
    if (users) {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const handleSelectSubscribers = () => {
    if (users) {
      const subscribers = users.filter(u => u.hasActiveSubscription);
      setSelectedUserIds(new Set(subscribers.map(u => u.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleSendToSelected = () => {
    if (subject && message && selectedUserIds.size > 0) {
      sendEmailMutation.mutate({ 
        userIds: Array.from(selectedUserIds), 
        subject, 
        message 
      });
    }
  };

  const handleBroadcastToAll = () => {
    if (subject && message) {
      broadcastEmailMutation.mutate({ subject, message });
    }
  };

  const subscribersCount = users?.filter(u => u.hasActiveSubscription).length || 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing</h1>
        <p className="text-muted-foreground">Send emails and communicate with your users</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Select Recipients
            </CardTitle>
            <CardDescription>
              Choose who should receive your email ({selectedUserIds.size} selected)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select All ({users?.length || 0})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectSubscribers}
                data-testid="button-select-subscribers"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select Subscribers ({subscribersCount})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearSelection}
                data-testid="button-clear-selection"
              >
                <Square className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            <div className="border rounded-md max-h-96 overflow-y-auto">
              <div className="divide-y">
                {users?.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center gap-3 p-3 hover-elevate"
                    data-testid={`user-row-${user.id}`}
                  >
                    <Checkbox
                      checked={selectedUserIds.has(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                      data-testid={`checkbox-user-${user.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.email}</div>
                      {(user.firstName || user.lastName) && (
                        <div className="text-sm text-muted-foreground truncate">
                          {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {user.isAdmin && (
                        <Badge variant="default" className="text-xs">Admin</Badge>
                      )}
                      {user.hasActiveSubscription && (
                        <Badge variant="default" className="text-xs">
                          {user.subscription?.plan}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Compose Email
            </CardTitle>
            <CardDescription>Write your email message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                data-testid="input-email-subject"
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter email message"
                rows={12}
                data-testid="textarea-email-message"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 flex-wrap">
            <Button
              onClick={handleSendToSelected}
              disabled={!subject || !message || selectedUserIds.size === 0 || sendEmailMutation.isPending}
              data-testid="button-send-selected"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendEmailMutation.isPending 
                ? "Sending..." 
                : `Send to Selected (${selectedUserIds.size})`}
            </Button>
            <Button
              variant="outline"
              onClick={handleBroadcastToAll}
              disabled={!subject || !message || broadcastEmailMutation.isPending}
              data-testid="button-broadcast-all"
            >
              <Mail className="h-4 w-4 mr-2" />
              {broadcastEmailMutation.isPending 
                ? "Sending..." 
                : `Broadcast to All (${users?.length || 0})`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
