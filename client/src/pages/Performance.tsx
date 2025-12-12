import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Target, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TopicPerformance {
  subject: string;
  topics: string[];
  totalAttempted: number;
  correctCount: number;
  accuracy: number;
  lastAttemptedAt: string | null;
  status: 'not_started' | 'strong' | 'improving' | 'needs_work';
}

interface WeakTopicsResponse {
  weakTopics: Array<TopicPerformance & { recommendation: string }>;
  overallRecommendation: string;
}

export default function Performance() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const category = new URLSearchParams(window.location.search).get("category") || "NCLEX";

  const { data: performanceData, isLoading: performanceLoading } = useQuery<TopicPerformance[]>({
    queryKey: ["/api/auth/user/topic-performance", category],
    enabled: isAuthenticated,
  });

  const { data: weakTopicsData, isLoading: weakTopicsLoading } = useQuery<WeakTopicsResponse>({
    queryKey: ["/api/auth/user/weak-topics", category],
    enabled: isAuthenticated,
  });

  const getCategoryColor = () => {
    switch (category) {
      case "NCLEX": return { gradient: "from-purple-500/20 to-purple-600/10", text: "text-purple-600" };
      case "TEAS": return { gradient: "from-orange-500/20 to-orange-600/10", text: "text-orange-600" };
      case "HESI": return { gradient: "from-teal-500/20 to-teal-600/10", text: "text-teal-600" };
      default: return { gradient: "from-primary/20 to-primary/10", text: "text-primary" };
    }
  };

  const getStatusColor = (status: TopicPerformance['status']) => {
    switch (status) {
      case 'strong': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'improving': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'needs_work': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: TopicPerformance['status']) => {
    switch (status) {
      case 'strong': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'improving': return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'needs_work': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <BookOpen className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getProgressBarColor = (accuracy: number) => {
    if (accuracy >= 80) return "bg-green-500";
    if (accuracy >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (authLoading || performanceLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your performance.</p>
          <Button onClick={() => setLocation("/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  const strongTopics = performanceData?.filter(p => p.status === 'strong') || [];
  const improvingTopics = performanceData?.filter(p => p.status === 'improving') || [];
  const needsWorkTopics = performanceData?.filter(p => p.status === 'needs_work') || [];
  const notStartedTopics = performanceData?.filter(p => p.status === 'not_started') || [];
  
  const totalAttempted = performanceData?.reduce((sum, p) => sum + p.totalAttempted, 0) || 0;
  const totalCorrect = performanceData?.reduce((sum, p) => sum + p.correctCount, 0) || 0;
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const colors = getCategoryColor();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => setLocation(`/topic-selection?category=${category}`)}
          data-testid="button-back-topics"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Topic Selection
        </Button>

        <div className={`rounded-lg bg-gradient-to-r ${colors.gradient} p-6 mb-8`}>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-performance-title">
            {category} Performance
          </h1>
          <p className="text-muted-foreground">
            Track your progress and identify areas for improvement.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold" data-testid="text-overall-accuracy">
                  {overallAccuracy}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600" data-testid="text-strong-count">
                  {strongTopics.length}
                </div>
                <p className="text-sm text-muted-foreground">Strong Areas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600" data-testid="text-improving-count">
                  {improvingTopics.length}
                </div>
                <p className="text-sm text-muted-foreground">Improving</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600" data-testid="text-needs-work-count">
                  {needsWorkTopics.length}
                </div>
                <p className="text-sm text-muted-foreground">Needs Work</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {weakTopicsData && weakTopicsData.weakTopics.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Target className="h-5 w-5" />
                Recommendations
              </CardTitle>
              <CardDescription className="text-orange-600 dark:text-orange-300">
                {weakTopicsData.overallRecommendation}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakTopicsData.weakTopics.map((topic) => (
                  <div 
                    key={topic.subject} 
                    className="bg-background rounded-lg p-4 border border-orange-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium">{topic.subject}</h4>
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                        {topic.accuracy}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{topic.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {strongTopics.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Strong Areas
                </CardTitle>
                <CardDescription>Areas where you're performing well (80%+ accuracy)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {strongTopics.map((topic) => (
                  <div key={topic.subject} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    {getStatusIcon(topic.status)}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{topic.subject}</span>
                        <span className="text-sm font-medium text-green-600">{topic.accuracy}%</span>
                      </div>
                      <Progress value={topic.accuracy} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {improvingTopics.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <TrendingUp className="h-5 w-5" />
                  Improving Areas
                </CardTitle>
                <CardDescription>Keep practicing to reach 80%+ (60-79% accuracy)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {improvingTopics.map((topic) => (
                  <div key={topic.subject} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    {getStatusIcon(topic.status)}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{topic.subject}</span>
                        <span className="text-sm font-medium text-yellow-600">{topic.accuracy}%</span>
                      </div>
                      <Progress value={topic.accuracy} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {needsWorkTopics.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Needs More Practice
                </CardTitle>
                <CardDescription>Focus on these areas (below 60% accuracy)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {needsWorkTopics.map((topic) => (
                  <div key={topic.subject} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    {getStatusIcon(topic.status)}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{topic.subject}</span>
                        <span className="text-sm font-medium text-red-600">{topic.accuracy}%</span>
                      </div>
                      <Progress value={topic.accuracy} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {notStartedTopics.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Not Yet Started
                </CardTitle>
                <CardDescription>Subjects you haven't practiced yet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {notStartedTopics.map((topic) => (
                  <div key={topic.subject} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {getStatusIcon(topic.status)}
                    <span className="text-muted-foreground">{topic.subject}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button 
            onClick={() => setLocation(`/topic-selection?category=${category}`)}
            data-testid="button-start-practice"
          >
            Start Practice Session
          </Button>
          <Button 
            variant="outline"
            onClick={() => setLocation("/categories")}
            data-testid="button-change-category"
          >
            Change Category
          </Button>
        </div>
      </div>
    </div>
  );
}
