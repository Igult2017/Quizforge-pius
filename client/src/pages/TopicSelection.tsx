import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ChevronDown, ChevronRight, BookOpen, Target, Sparkles, ArrowLeft } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";

interface SubjectInfo {
  subject: string;
  topics: string[];
  questionCount: number;
}

interface TopicPerformance {
  subject: string;
  topics: string[];
  totalAttempted: number;
  correctCount: number;
  accuracy: number;
  lastAttemptedAt: string | null;
  status: 'not_started' | 'strong' | 'improving' | 'needs_work';
}

export default function TopicSelection() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const category = new URLSearchParams(window.location.search).get("category") || "NCLEX";
  
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [useAdaptive, setUseAdaptive] = useState(true);

  const { data: topicsData, isLoading: topicsLoading } = useQuery<Record<string, SubjectInfo[]>>({
    queryKey: ["/api/topics"],
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery<TopicPerformance[]>({
    queryKey: ["/api/auth/user/topic-performance", category],
    enabled: isAuthenticated,
  });

  const subjects = topicsData?.[category] || [];
  const performanceMap = new Map(performanceData?.map(p => [p.subject, p]));

  const toggleSubject = (subject: string) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subject)) {
      newSelected.delete(subject);
    } else {
      newSelected.add(subject);
    }
    setSelectedSubjects(newSelected);
  };

  const toggleExpanded = (subject: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subject)) {
      newExpanded.delete(subject);
    } else {
      newExpanded.add(subject);
    }
    setExpandedSubjects(newExpanded);
  };

  const selectAll = () => {
    setSelectedSubjects(new Set(subjects.map(s => s.subject)));
  };

  const clearAll = () => {
    setSelectedSubjects(new Set());
  };

  const getStatusColor = (status: TopicPerformance['status']) => {
    switch (status) {
      case 'strong': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'improving': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'needs_work': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: TopicPerformance['status']) => {
    switch (status) {
      case 'strong': return 'Strong';
      case 'improving': return 'Improving';
      case 'needs_work': return 'Needs Work';
      default: return 'Not Started';
    }
  };

  const handleStartQuiz = () => {
    const params = new URLSearchParams({ category });
    if (selectedSubjects.size > 0 && selectedSubjects.size < subjects.length) {
      params.set("subjects", Array.from(selectedSubjects).join(","));
    }
    if (useAdaptive) {
      params.set("adaptive", "true");
    }
    setLocation(`/quiz?${params.toString()}`);
  };

  const getCategoryColor = () => {
    switch (category) {
      case "NCLEX": return "from-purple-500/20 to-purple-600/10";
      case "TEAS": return "from-orange-500/20 to-orange-600/10";
      case "HESI": return "from-teal-500/20 to-teal-600/10";
      default: return "from-primary/20 to-primary/10";
    }
  };

  if (topicsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => setLocation("/categories")}
          data-testid="button-back-categories"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Button>

        <div className={`rounded-lg bg-gradient-to-r ${getCategoryColor()} p-6 mb-8`}>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-category-title">
            {category} Practice
          </h1>
          <p className="text-muted-foreground">
            Choose specific subjects to focus on, or let our adaptive system guide your learning.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Select Subjects
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll} data-testid="button-select-all">
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAll} data-testid="button-clear-all">
                      Clear
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {selectedSubjects.size === 0 
                    ? "All subjects will be included (recommended for comprehensive practice)"
                    : `${selectedSubjects.size} subject${selectedSubjects.size > 1 ? 's' : ''} selected`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjects.map((subject) => {
                  const performance = performanceMap.get(subject.subject);
                  const isExpanded = expandedSubjects.has(subject.subject);
                  const isSelected = selectedSubjects.has(subject.subject);

                  return (
                    <Collapsible key={subject.subject} open={isExpanded}>
                      <div 
                        className={`border rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover-elevate'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSubject(subject.subject)}
                            className="mt-1"
                            data-testid={`checkbox-subject-${subject.subject.replace(/\s+/g, '-').toLowerCase()}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h3 className="font-medium">{subject.subject}</h3>
                              <div className="flex items-center gap-2">
                                {performance && (
                                  <Badge 
                                    variant="outline" 
                                    className={`${getStatusColor(performance.status)} text-xs`}
                                  >
                                    {getStatusLabel(performance.status)}
                                  </Badge>
                                )}
                                <CollapsibleTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => toggleExpanded(subject.subject)}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                            </div>
                            
                            {performance && performance.totalAttempted > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <span>{performance.totalAttempted} questions attempted</span>
                                  <span>{performance.accuracy}% accuracy</span>
                                </div>
                                <Progress value={performance.accuracy} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <CollapsibleContent className="pt-3 mt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-2">Topics covered:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {subject.topics.map((topic) => (
                              <Badge key={topic} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quiz Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    useAdaptive ? 'border-primary bg-primary/5' : 'hover-elevate'
                  }`}
                  onClick={() => setUseAdaptive(!useAdaptive)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={useAdaptive}
                      onCheckedChange={() => setUseAdaptive(!useAdaptive)}
                      data-testid="checkbox-adaptive-learning"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-medium">Adaptive Learning</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Include extra questions from areas you need to improve
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleStartQuiz}
                  data-testid="button-start-quiz"
                >
                  Start Practice
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/performance?category=${category}`)}
                  data-testid="button-view-performance"
                >
                  View Performance
                </Button>
              </CardContent>
            </Card>

            {performanceData && performanceData.some(p => p.status === 'needs_work') && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-orange-700 dark:text-orange-400">
                    Areas to Focus On
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {performanceData
                      .filter(p => p.status === 'needs_work')
                      .slice(0, 3)
                      .map(p => (
                        <li key={p.subject} className="text-orange-700 dark:text-orange-400">
                          {p.subject} ({p.accuracy}%)
                        </li>
                      ))
                    }
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
