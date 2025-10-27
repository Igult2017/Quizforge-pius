import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Brain, Database, Plus, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuestionCount {
  category: string;
  count: number;
}

export default function AdminQuestions() {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>("NCLEX");
  const [count, setCount] = useState<string>("10");
  const [subject, setSubject] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");

  console.log("AdminQuestions component rendered");

  // Fetch question counts
  const { data: questionCounts, isLoading: countsLoading, error: countsError } = useQuery<QuestionCount[]>({
    queryKey: ["/api/admin/questions/counts"],
  });

  console.log("Question counts:", { questionCounts, countsLoading, countsError });

  // Generate questions mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/questions/generate", {
        category,
        count: parseInt(count),
        subject: subject || undefined,
        difficulty,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Questions generated successfully!",
        description: `Added ${data.generated} ${category} questions to the database.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions/counts"] });
      setCount("10");
      setSubject("");
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1 || numCount > 100) {
      toast({
        title: "Invalid count",
        description: "Please enter a number between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  };

  const getCategoryIcon = (cat: string) => {
    const colors = {
      NCLEX: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      TEAS: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
      HESI: "bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
    };
    return colors[cat as keyof typeof colors] || "bg-gray-100 dark:bg-gray-800 text-gray-600";
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-background">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">AI Question Generator</h1>
        <p className="text-muted-foreground">
          Generate practice questions using AI and manage your question database
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

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Generate New Questions</CardTitle>
          </div>
          <CardDescription>
            Use AI to generate high-quality practice questions. Max 100 questions per batch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
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
                <Label htmlFor="count">Number of Questions *</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="10"
                  required
                  data-testid="input-count"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Pharmacology, Medical-Surgical"
                  data-testid="input-subject"
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

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {generateMutation.isSuccess && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Questions generated successfully!</span>
                  </div>
                )}
                {generateMutation.isError && (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>Generation failed. Please try again.</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={generateMutation.isPending}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Questions
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About AI Question Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Questions are generated using DeepSeek AI with nursing exam-specific prompts
          </p>
          <p>
            • Each question includes 4 options, correct answer, and detailed explanation
          </p>
          <p>
            • Generation typically takes 10-30 seconds depending on the batch size
          </p>
          <p>
            • Questions are automatically saved to the database after generation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
