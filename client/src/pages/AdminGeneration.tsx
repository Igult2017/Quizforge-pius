import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SubjectProgress = {
  id: number;
  category: string;
  subject: string;
  targetCount: number;
  generatedCount: number;
  status: string;
  lastRunAt: string | null;
  errorCount: number;
  lastError: string | null;
  updatedAt: string;
};

type GenerationStatus = {
  isEnabled: boolean;
  totalTarget: number;
  totalGenerated: number;
  subjects: SubjectProgress[];
};

export default function AdminGeneration() {
  const { toast } = useToast();

  // Fetch generation status
  const { data: status, isLoading, refetch } = useQuery<GenerationStatus>({
    queryKey: ["/api/admin/generation/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Toggle auto-generation
  const toggleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const url = `/api/admin/generation/${enable ? "resume" : "pause"}`;
      const response = await fetch(url, { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation/status"] });
      toast({
        title: status?.isEnabled ? "Generation paused" : "Generation resumed",
        description: status?.isEnabled
          ? "Background generation has been paused"
          : "Background generation will resume shortly",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Trigger manual generation
  const triggerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/generation/trigger", { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation/status"] });
      toast({
        title: "Generation triggered",
        description: "Manual generation cycle started",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Group question counts by category from actual subject data
  const categoryTotals = status?.subjects.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.generatedCount;
    return acc;
  }, {}) ?? {};

  const totalQuestions = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Background Question Generation</h1>
        <p className="text-muted-foreground">
          Automatic generation of questions across all exam categories
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Generation Controls</CardTitle>
              <CardDescription>
                {totalQuestions.toLocaleString()} total questions in the database
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {status?.isEnabled ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Play className="h-3 w-3" data-testid="icon-generation-active" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Pause className="h-3 w-3" data-testid="icon-generation-paused" />
                  Paused
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => toggleMutation.mutate(!status?.isEnabled)}
              disabled={toggleMutation.isPending}
              variant={status?.isEnabled ? "secondary" : "default"}
              data-testid={status?.isEnabled ? "button-pause-generation" : "button-resume-generation"}
            >
              {status?.isEnabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Generation
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Generation
                </>
              )}
            </Button>

            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
              data-testid="button-refresh-status"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>

            <Button
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending || !status?.isEnabled}
              variant="outline"
              data-testid="button-trigger-generation"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${triggerMutation.isPending ? "animate-spin" : ""}`} />
              Run Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question counts by category */}
      <Card>
        <CardHeader>
          <CardTitle>Questions in Database</CardTitle>
          <CardDescription>Actual question count per exam category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {Object.entries(categoryTotals)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between py-3">
                  <span className="font-medium">{category}</span>
                  <span className="text-2xl font-bold">{count.toLocaleString()}</span>
                </div>
              ))}
            <div className="flex items-center justify-between py-3">
              <span className="font-semibold text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{totalQuestions.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
