import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Brain, Database, Plus, CheckCircle2, XCircle, Pause, Play, Trash2, Clock, AlertCircle, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

interface QuestionCount {
  category: string;
  count: number;
}

interface TopicCount {
  category: string;
  subject: string;
  count: number;
}

interface GenerationJob {
  id: number;
  category: string;
  topic: string;
  difficulty: string;
  totalCount: number;
  generatedCount: number;
  batchSize: number;
  sampleQuestion: string | null;
  status: string;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export default function AdminQuestions() {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>("NCLEX");
  const [totalCount, setTotalCount] = useState<string>("50");
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [sampleQuestion, setSampleQuestion] = useState<string>("");

  // Fetch question counts
  const { data: questionCounts, isLoading: countsLoading, error: countsError } = useQuery<QuestionCount[]>({
    queryKey: ["/api/admin/questions/counts"],
  });

  // Fetch question counts by topic
  const { data: topicCounts } = useQuery<TopicCount[]>({
    queryKey: ["/api/admin/questions/counts-by-topic"],
  });

  // Fetch generation jobs with auto-refresh
  const { data: jobs, isLoading: jobsLoading } = useQuery<GenerationJob[]>({
    queryKey: ["/api/admin/generation-jobs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create generation job mutation
  const createJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/generation-jobs", {
        category,
        topic,
        difficulty,
        totalCount: parseInt(totalCount),
        sampleQuestion: sampleQuestion || undefined,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Generation job created!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-jobs"] });
      setTotalCount("50");
      setTopic("");
      setSampleQuestion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create job",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Pause job mutation
  const pauseJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/admin/generation-jobs/${jobId}/pause`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Job paused" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-jobs"] });
    },
  });

  // Resume job mutation
  const resumeJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/admin/generation-jobs/${jobId}/resume`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Job resumed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-jobs"] });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/generation-jobs/${jobId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Job deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions/counts"] });
    },
  });

  // Manual job processing (since auto-processor is disabled)
  const processJobsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/generation-jobs/process");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Processing triggered", description: "Generating next batch of questions..." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions/counts"] });
    },
    onError: (error: any) => {
      toast({ title: "Processing failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numCount = parseInt(totalCount);
    if (isNaN(numCount) || numCount < 5 || numCount > 1000) {
      toast({
        title: "Invalid count",
        description: "Please enter a number between 5 and 1000",
        variant: "destructive",
      });
      return;
    }

    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic/subject for the questions",
        variant: "destructive",
      });
      return;
    }

    createJobMutation.mutate();
  };

  const getCategoryIcon = (cat: string) => {
    const colors = {
      NCLEX: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      TEAS: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
      HESI: "bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
    };
    return colors[cat as keyof typeof colors] || "bg-gray-100 dark:bg-gray-800 text-gray-600";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "running":
        return <Badge variant="default" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Running</Badge>;
      case "completed":
        return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case "paused":
        return <Badge variant="outline" className="gap-1"><Pause className="h-3 w-3" /> Paused</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (countsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loader-questions" />
        <p className="text-muted-foreground">Loading question data...</p>
      </div>
    );
  }

  if (countsError) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error loading question counts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {countsError instanceof Error ? countsError.message : "Failed to load question counts. Please refresh the page."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = questionCounts?.reduce((sum, c) => sum + c.count, 0) || 0;
  const activeJobs = jobs?.filter(j => j.status === "running" || j.status === "pending") || [];
  const completedJobs = jobs?.filter(j => j.status === "completed") || [];
  const otherJobs = jobs?.filter(j => j.status !== "running" && j.status !== "pending" && j.status !== "completed") || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-background">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">AI Question Generator</h1>
        <p className="text-muted-foreground">
          Generate practice questions using AI. Create batch jobs that process 5 questions at a time.
        </p>
      </div>

      {/* Question Counts Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {questionCounts?.map((item) => (
          <Card key={item.category} data-testid={`card-count-${item.category}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.category}</CardTitle>
              <div className={`p-2 rounded-md ${getCategoryIcon(item.category)}`}>
                <Database className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-count-${item.category}`}>
                {item.count.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">questions available</p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Database className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-questions">
              {totalQuestions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">total questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Topic Breakdown Section */}
      {topicCounts && topicCounts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Questions by Topic</CardTitle>
            </div>
            <CardDescription>
              Detailed breakdown of questions per topic in each category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["NCLEX", "TEAS", "HESI"].map((cat) => {
              const catTopics = topicCounts.filter(t => t.category === cat);
              const catTotal = catTopics.reduce((sum, t) => sum + t.count, 0);
              
              if (catTopics.length === 0) return null;
              
              return (
                <Collapsible key={cat} defaultOpen={false}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-3 h-auto"
                      data-testid={`toggle-topics-${cat}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${getCategoryIcon(cat)}`}>
                          <Database className="h-4 w-4" />
                        </div>
                        <span className="font-semibold">{cat}</span>
                        <Badge variant="secondary">{catTopics.length} topics</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{catTotal.toLocaleString()} questions</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-2 pt-2 pl-4">
                      {catTopics.map((topic, index) => (
                        <div 
                          key={`${topic.category}-${topic.subject}-${index}`}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                          data-testid={`topic-row-${topic.category}-${index}`}
                        >
                          <span className="text-sm">{topic.subject}</span>
                          <Badge variant="outline">{topic.count.toLocaleString()}</Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Batch Generation Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Create Batch Generation Job</CardTitle>
          </div>
          <CardDescription>
            Request between 5-1000 questions. They will be generated in batches of 5 to prevent timeouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NCLEX">NCLEX</SelectItem>
                    <SelectItem value="TEAS">ATI TEAS</SelectItem>
                    <SelectItem value="HESI">HESI A2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCount">Number of Questions * (5-1000)</Label>
                <Input
                  id="totalCount"
                  type="number"
                  min="5"
                  max="1000"
                  value={totalCount}
                  onChange={(e) => setTotalCount(e.target.value)}
                  placeholder="50"
                  required
                  data-testid="input-total-count"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic/Subject *</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Pharmacology, Medical-Surgical, Anatomy"
                  required
                  data-testid="input-topic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty" data-testid="select-difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampleQuestion">Sample Question (Optional)</Label>
              <Textarea
                id="sampleQuestion"
                value={sampleQuestion}
                onChange={(e) => setSampleQuestion(e.target.value)}
                placeholder="Paste a sample question to guide the AI on style, format, and complexity. The AI will generate similar questions based on this example."
                rows={4}
                data-testid="textarea-sample-question"
              />
              <p className="text-xs text-muted-foreground">
                Providing a sample helps the AI match your preferred question style and complexity level.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t gap-4">
              <div className="text-sm text-muted-foreground">
                Questions are generated 5 at a time. Click "Process Jobs" to generate.
              </div>

              <Button
                type="submit"
                disabled={createJobMutation.isPending}
                data-testid="button-create-job"
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Start Generation Job
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Active Generation Jobs ({activeJobs.length})
            </CardTitle>
            <Button
              onClick={() => processJobsMutation.mutate()}
              disabled={processJobsMutation.isPending}
              data-testid="button-process-jobs"
            >
              {processJobsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Process Jobs
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map((job) => {
              const progress = Math.round((job.generatedCount / job.totalCount) * 100);
              return (
                <div key={job.id} className="border rounded-md p-4 space-y-3" data-testid={`job-active-${job.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{job.category}</Badge>
                      <span className="font-medium">{job.topic}</span>
                      <Badge variant="secondary">{job.difficulty}</Badge>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === "running" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseJobMutation.mutate(job.id)}
                          disabled={pauseJobMutation.isPending}
                          data-testid={`button-pause-${job.id}`}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseJobMutation.mutate(job.id)}
                          disabled={pauseJobMutation.isPending}
                          data-testid={`button-pause-${job.id}`}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        disabled={deleteJobMutation.isPending}
                        data-testid={`button-delete-${job.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{job.generatedCount} / {job.totalCount} questions</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {job.lastError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>Last error: {job.lastError}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Paused/Failed Jobs */}
      {otherJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paused/Failed Jobs ({otherJobs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherJobs.map((job) => {
              const progress = Math.round((job.generatedCount / job.totalCount) * 100);
              return (
                <div key={job.id} className="border rounded-md p-4 space-y-3" data-testid={`job-other-${job.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{job.category}</Badge>
                      <span className="font-medium">{job.topic}</span>
                      <Badge variant="secondary">{job.difficulty}</Badge>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resumeJobMutation.mutate(job.id)}
                        disabled={resumeJobMutation.isPending}
                        data-testid={`button-resume-${job.id}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        disabled={deleteJobMutation.isPending}
                        data-testid={`button-delete-${job.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{job.generatedCount} / {job.totalCount} questions</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {job.lastError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>Last error: {job.lastError}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Jobs (last 5) */}
      {completedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Recently Completed ({completedJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`job-completed-${job.id}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{job.category}</Badge>
                    <span className="text-sm">{job.topic}</span>
                    <span className="text-xs text-muted-foreground">
                      {job.generatedCount} questions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : ""}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteJobMutation.mutate(job.id)}
                      disabled={deleteJobMutation.isPending}
                      data-testid={`button-delete-completed-${job.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Batch Generation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            1. Create a job with your desired topic, difficulty, and count (5-1000 questions)
          </p>
          <p>
            2. The system generates 5 questions at a time every 30 seconds
          </p>
          <p>
            3. Progress is tracked automatically - you can pause/resume anytime
          </p>
          <p>
            4. If errors occur, the job retries up to 3 times before pausing
          </p>
          <p>
            5. Provide a sample question to guide the AI on your preferred style
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
