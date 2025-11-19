import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
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
  const { data: status, isLoading } = useQuery<GenerationStatus>({
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

  const overallProgress = status
    ? (status.totalGenerated / status.totalTarget) * 100
    : 0;

  const completedSubjects = status?.subjects.filter((s) => s.status === "completed").length || 0;
  const totalSubjects = status?.subjects.length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Background Question Generation</h1>
        <p className="text-muted-foreground">
          Automatic generation of questions across all exam categories
        </p>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                {status?.totalGenerated.toLocaleString()} of {status?.totalTarget.toLocaleString()}{" "}
                questions generated
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
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Questions</span>
              <span className="font-medium">{overallProgress.toFixed(1)}%</span>
            </div>
            <Progress value={overallProgress} data-testid="progress-overall" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subjects</span>
            <span className="font-medium">
              {completedSubjects} / {totalSubjects} completed
            </span>
          </div>

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

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Progress</CardTitle>
          <CardDescription>Progress by exam category and subject area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status?.subjects.map((subject) => {
              const progress = (subject.generatedCount / subject.targetCount) * 100;
              const statusColor =
                subject.status === "completed"
                  ? "text-green-600 dark:text-green-400"
                  : subject.status === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground";

              return (
                <div key={subject.id} className="space-y-2" data-testid={`subject-${subject.category}-${subject.subject}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {subject.category} - {subject.subject}
                        </span>
                        {subject.status === "completed" && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                        {subject.status === "running" && (
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                        {subject.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {subject.generatedCount.toLocaleString()} / {subject.targetCount.toLocaleString()}
                        </span>
                        {subject.lastRunAt && (
                          <span className="text-xs">
                            Last run: {new Date(subject.lastRunAt).toLocaleTimeString()}
                          </span>
                        )}
                        {subject.errorCount > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {subject.errorCount} errors
                          </span>
                        )}
                      </div>
                      {subject.lastError && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                          Error: {subject.lastError}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <span className={`text-sm font-medium ${statusColor}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={progress} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Background generation runs every 5 minutes, generating 100 questions per cycle
          </p>
          <p>
            • Questions are generated in rotation across all subjects until targets are met
          </p>
          <p>
            • Generation automatically pauses when all subjects reach their target counts
          </p>
          <p>
            • Manual admin generation remains available for specific subjects as needed
          </p>
          <p>
            • Progress persists across server restarts - generation resumes where it left off
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
