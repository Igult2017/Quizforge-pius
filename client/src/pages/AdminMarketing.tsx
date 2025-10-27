import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send } from "lucide-react";

export default function AdminMarketing() {
  const { toast } = useToast();
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

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

  const handleBroadcast = () => {
    if (broadcastSubject && broadcastMessage) {
      broadcastEmailMutation.mutate({ subject: broadcastSubject, message: broadcastMessage });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing</h1>
        <p className="text-muted-foreground">Send emails and communicate with your users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Broadcast Email
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
              rows={8}
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
    </div>
  );
}
