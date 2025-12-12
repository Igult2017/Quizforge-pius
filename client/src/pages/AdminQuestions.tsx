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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Brain, Database, Plus, CheckCircle2, XCircle, Pause, Play, Trash2, Clock, AlertCircle, ChevronDown, ChevronRight, BookOpen, FileQuestion, Layers } from "lucide-react";
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
  areasTocover: string | null;
  status: string;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export default function AdminQuestions() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("database");
  const [category, setCategory] = useState<string>("NCLEX");
  const [totalCount, setTotalCount] = useState<string>("50");
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [sampleQuestion, setSampleQuestion] = useState<string>("");
  const [areasTocover, setAreasTocover] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["NCLEX", "TEAS", "HESI"]));

  const { data: questionCounts, isLoading: countsLoading, error: countsError } = useQuery<QuestionCount[]>({
    queryKey: ["/api/admin/questions/counts"],
  });

  const { data: topicCounts } = useQuery<TopicCount[]>({
    queryKey: ["/api/admin/questions/counts-by-topic"],
  });

  const { data: jobs } = useQuery<GenerationJob[]>({
    queryKey: ["/api/admin/generation-jobs"],
    refetchInterval: 5000,
  });

  const createJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/generation-jobs", {
        category,
        topic,
        difficulty,
        totalCount: parseInt(totalCount),
        sampleQuestion: sampleQuestion,
        areasTocover: areasTocover || undefined,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Generation started!",
        description: `Creating ${totalCount} questions on "${topic}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-jobs"] });
      setTotalCount("50");
      setTopic("");
      setSampleQuestion("");
      setAreasTocover("");
      setActiveTab("generate");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create job",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

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

    if (!sampleQuestion.trim() || sampleQuestion.trim().length < 50) {
      toast({
        title: "Sample question required",
        description: "Please provide a sample question (minimum 50 characters) to ensure quality generation",
        variant: "destructive",
      });
      return;
    }

    createJobMutation.mutate();
  };

  const toggleCategory = (cat: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(cat)) {
      newExpanded.delete(cat);
    } else {
      newExpanded.add(cat);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryColor = (cat: string) => {
    const colors = {
      NCLEX: { bg: "bg-purple-500", light: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
      TEAS: { bg: "bg-orange-500", light: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
      HESI: { bg: "bg-teal-500", light: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-600 dark:text-teal-400" },
    };
    return colors[cat as keyof typeof colors] || { bg: "bg-gray-500", light: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600" };
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

  const totalQuestions = questionCounts?.reduce((sum, c) => sum + c.count, 0) || 0;
  const activeJobs = jobs?.filter(j => j.status === "running" || j.status === "pending") || [];
  const completedJobs = jobs?.filter(j => j.status === "completed") || [];
  const otherJobs = jobs?.filter(j => j.status !== "running" && j.status !== "pending" && j.status !== "completed") || [];

  useEffect(() => {
    if (activeJobs.length > 0) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-jobs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/questions/counts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/questions/counts-by-topic"] });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeJobs.length]);

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
            <CardTitle className="text-destructive">Error loading questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {countsError instanceof Error ? countsError.message : "Failed to load. Please refresh."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-background">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Question Bank</h1>
          <p className="text-muted-foreground">
            Manage and generate practice questions for all exam categories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{totalQuestions.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Questions</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="database" className="gap-2" data-testid="tab-database">
            <Database className="h-4 w-4" />
            Questions Database
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2" data-testid="tab-generate">
            <Brain className="h-4 w-4" />
            Generate Questions
          </TabsTrigger>
        </TabsList>

        {/* Database View Tab */}
        <TabsContent value="database" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {["NCLEX", "TEAS", "HESI"].map((cat) => {
              const count = questionCounts?.find(c => c.category === cat)?.count || 0;
              const catTopics = topicCounts?.filter(t => t.category === cat) || [];
              const colors = getCategoryColor(cat);
              
              return (
                <Card key={cat} className="overflow-hidden" data-testid={`card-summary-${cat}`}>
                  <div className={`h-1 ${colors.bg}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cat}</CardTitle>
                      <Badge variant="secondary">{catTopics.length} topics</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid={`count-${cat}`}>
                      {count.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">questions available</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detailed Topic Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle>Questions by Topic</CardTitle>
              </div>
              <CardDescription>
                Click on a category to see all topics and question counts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["NCLEX", "TEAS", "HESI"].map((cat) => {
                const catTopics = topicCounts?.filter(t => t.category === cat) || [];
                const catTotal = catTopics.reduce((sum, t) => sum + t.count, 0);
                const colors = getCategoryColor(cat);
                const isExpanded = expandedCategories.has(cat);
                
                if (catTopics.length === 0) {
                  return (
                    <div key={cat} className={`rounded-lg p-4 ${colors.light}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                          <span className="font-semibold">{cat}</span>
                        </div>
                        <span className="text-muted-foreground text-sm">No questions yet</span>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={cat} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(cat)}
                      className={`w-full p-4 flex items-center justify-between hover-elevate ${colors.light}`}
                      data-testid={`toggle-${cat}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                        <span className="font-semibold text-lg">{cat}</span>
                        <Badge variant="outline" className="ml-2">
                          {catTopics.length} {catTopics.length === 1 ? "topic" : "topics"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">{catTotal.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">questions</div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t bg-background">
                        <div className="divide-y">
                          {catTopics
                            .sort((a, b) => b.count - a.count)
                            .map((topic, index) => {
                              const percentage = catTotal > 0 ? (topic.count / catTotal) * 100 : 0;
                              return (
                                <div
                                  key={`${topic.category}-${topic.subject}-${index}`}
                                  className="p-4 flex items-center justify-between gap-4"
                                  data-testid={`topic-${cat}-${index}`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileQuestion className={`h-4 w-4 shrink-0 ${colors.text}`} />
                                    <span className="font-medium truncate">{topic.subject}</span>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-24 hidden sm:block">
                                      <Progress value={percentage} className="h-2" />
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                      <div className="font-semibold">{topic.count.toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          {/* Active Jobs Banner */}
          {activeJobs.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {activeJobs.length} Active Generation {activeJobs.length === 1 ? "Job" : "Jobs"}
                  </CardTitle>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400">
                    Auto-processing
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeJobs.map((job) => {
                  const progress = Math.round((job.generatedCount / job.totalCount) * 100);
                  const colors = getCategoryColor(job.category);
                  return (
                    <div key={job.id} className="bg-background rounded-lg p-4 space-y-3" data-testid={`job-active-${job.id}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                          <Badge variant="outline">{job.category}</Badge>
                          <span className="font-medium">{job.topic}</span>
                          <Badge variant="secondary">{job.difficulty}</Badge>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseJobMutation.mutate(job.id)}
                            disabled={pauseJobMutation.isPending}
                            data-testid={`button-pause-${job.id}`}
                          >
                            <Pause className="h-4 w-4" />
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
                          <span className="text-muted-foreground">
                            {job.generatedCount} / {job.totalCount} questions generated
                          </span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      {job.lastError && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>{job.lastError}</span>
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
              <CardContent className="space-y-3">
                {otherJobs.map((job) => {
                  const progress = Math.round((job.generatedCount / job.totalCount) * 100);
                  return (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3" data-testid={`job-other-${job.id}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{job.category}</Badge>
                          <span className="font-medium">{job.topic}</span>
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
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteJobMutation.mutate(job.id)}
                            data-testid={`button-delete-${job.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{job.generatedCount} / {job.totalCount}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Create Job Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle>Create New Generation Job</CardTitle>
              </div>
              <CardDescription>
                Configure and start a new batch of AI-generated questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Exam Category</Label>
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
                    <Label htmlFor="totalCount">Number of Questions (5-1000)</Label>
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
                    <Label htmlFor="topic">Topic/Subject</Label>
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
                    <Label htmlFor="difficulty">Difficulty Level</Label>
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
                  <Label htmlFor="sampleQuestion">
                    Sample Question <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="sampleQuestion"
                    value={sampleQuestion}
                    onChange={(e) => setSampleQuestion(e.target.value)}
                    placeholder="Paste a complete sample question including:
- The question text
- All 4 answer options (A, B, C, D)
- The correct answer
- A detailed explanation

The AI will match this style, format, and complexity level."
                    rows={8}
                    data-testid="textarea-sample-question"
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required (min 50 characters). The AI generates questions matching your sample's quality and format.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areasTocover">Specific Areas to Cover (Optional)</Label>
                  <Textarea
                    id="areasTocover"
                    value={areasTocover}
                    onChange={(e) => setAreasTocover(e.target.value)}
                    placeholder="List subtopics the questions should cover:
- Cardiac conditions (heart failure, MI)
- Respiratory conditions (COPD, pneumonia)
- Diabetes management
- Post-operative care"
                    rows={4}
                    data-testid="textarea-areas-to-cover"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t gap-4">
                  <p className="text-sm text-muted-foreground">
                    Questions generate automatically in batches of 5 until complete.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={createJobMutation.isPending}
                    data-testid="button-create-job"
                  >
                    {createJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Generation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recently Completed */}
          {completedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Recently Completed ({completedJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {completedJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="py-3 flex items-center justify-between" data-testid={`job-completed-${job.id}`}>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{job.category}</Badge>
                        <span className="font-medium">{job.topic}</span>
                        <span className="text-sm text-muted-foreground">
                          {job.generatedCount} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : ""}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteJobMutation.mutate(job.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
