import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAIRoadmap } from "@/hooks/useAIRoadmap";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, Clock, TrendingUp, Calendar, BookOpen, Users, Award, CheckCircle, AlertCircle, Zap, Star, Plus, Sparkles, ChevronRight, Link as LinkIcon, Globe, RefreshCw, Download } from "lucide-react";

interface Import {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  problems_count: number;
  contest_rating: number;
  badges: any[];
  status: string;
  last_synced: string;
  import_data: any;
  created_at: string;
  updated_at: string;
}

const platformsInfo: Record<string, { name: string, icon: string }> = {
  leetcode: { name: 'LeetCode', icon: '💻' },
  hackerrank: { name: 'HackerRank', icon: '🧑‍💻' },
  codeforces: { name: 'Codeforces', icon: '🚀' },
  codechef: { name: 'CodeChef', icon: '🌶️' },
  atcoder: { name: 'AtCoder', icon: '🇯🇵' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { generateRoadmap, loading: roadmapLoading } = useAIRoadmap();
  const { toast } = useToast();
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [imports, setImports] = useState<Import[]>([]);
  const [showRoadmapDialog, setShowRoadmapDialog] = useState(false);
  const [roadmapForm, setRoadmapForm] = useState({
    goal: '',
    timeline_weeks: 4,
    available_hours_per_week: 10,
    difficulty_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
  });

  useEffect(() => {
    if(user) {
      fetchStudyPlans();
      fetchRecentSessions();
      fetchImports();
    }
  }, [user]);

  const fetchImports = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('imports')
      .select('*')
      .eq('user_id', user.id);
    if (data) {
      // Transform the data to match our interface
      const transformedData = data.map(item => ({
        ...item,
        contest_rating: (item.import_data as any)?.contest_rating || 0,
        badges: (item.import_data as any)?.badges || []
      }));
      setImports(transformedData);
    }
  };

  const fetchStudyPlans = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setStudyPlans(data || []);
    } catch (error) {
      console.error('Error fetching study plans:', error);
    }
  };

  const fetchRecentSessions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!roadmapForm.goal.trim()) {
      toast({
        title: "Error",
        description: "Please enter a study goal",
        variant: "destructive"
      });
      return;
    }

    const result = await generateRoadmap(roadmapForm);

    if (result) {
      toast({
        title: "Success!",
        description: "Your AI study roadmap has been created",
      });
      setShowRoadmapDialog(false);
      setRoadmapForm({
        goal: '',
        timeline_weeks: 4,
        available_hours_per_week: 10,
        difficulty_level: 'intermediate'
      });
      fetchStudyPlans(); // Refresh the study plans list
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Hero Section with Feature Highlights */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome to StudyForge</h1>
              <p className="text-primary-foreground/80 text-lg">Your AI-Powered Learning Command Center</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">12 day streak</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">1,250 XP</span>
              </div>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Brain className="h-4 w-4" />
              <span className="text-sm">Adaptive AI Learning</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Peer Study Rooms</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Globe className="h-4 w-4" />
              <span className="text-sm">Multi-language Support</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Smart Reminders</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Download className="h-4 w-4" />
              <span className="text-sm">One-Click Exports</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* AI Roadmap */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Study Roadmap</CardTitle>
                    <p className="text-sm text-muted-foreground">Personalized learning powered by explainable AI</p>
                  </div>
                </div>
                <Dialog open={showRoadmapDialog} onOpenChange={setShowRoadmapDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Create AI Study Roadmap
                      </DialogTitle>
                      <DialogDescription>
                        Let our explainable AI create a personalized study plan with traceable reasoning.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="goal">Study Goal</Label>
                        <Input
                          id="goal"
                          placeholder="e.g., Learn React for web development"
                          value={roadmapForm.goal}
                          onChange={(e) => setRoadmapForm(prev => ({ ...prev, goal: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="timeline">Timeline (weeks)</Label>
                          <Input
                            id="timeline"
                            type="number"
                            min="1"
                            max="52"
                            value={roadmapForm.timeline_weeks}
                            onChange={(e) => setRoadmapForm(prev => ({ ...prev, timeline_weeks: parseInt(e.target.value) || 4 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hours">Hours/week</Label>
                          <Input
                            id="hours"
                            type="number"
                            min="1"
                            max="40"
                            value={roadmapForm.available_hours_per_week}
                            onChange={(e) => setRoadmapForm(prev => ({ ...prev, available_hours_per_week: parseInt(e.target.value) || 10 }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select
                          value={roadmapForm.difficulty_level}
                          onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                            setRoadmapForm(prev => ({ ...prev, difficulty_level: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleGenerateRoadmap}
                        disabled={roadmapLoading}
                        className="w-full"
                      >
                        {roadmapLoading ? "Generating..." : "Create Roadmap"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {studyPlans.length > 0 ? (
                <div className="space-y-3">
                  {studyPlans.slice(0, 2).map((plan) => (
                    <div key={plan.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{plan.title}</span>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      </div>
                      <Progress value={Math.floor(Math.random() * 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {plan.difficulty_level} • {plan.timeline_days} days • {plan.hours_per_week}h/week
                      </p>
                    </div>
                  ))}
                  <Button className="w-full" asChild>
                    <a href="/plans">View All Plans</a>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">No study plans yet</p>
                  <Button
                    onClick={() => setShowRoadmapDialog(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Your First Roadmap
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                Coding Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imports.length > 0 ? (
                <Tabs defaultValue={imports[0]?.platform || ''} className="w-full">
                  <TabsList>
                    {imports.map(p => (
                      <TabsTrigger key={p.platform} value={p.platform}>
                        {platformsInfo[p.platform]?.icon} {platformsInfo[p.platform]?.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {imports.map(p => (
                    <TabsContent key={p.platform} value={p.platform}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="text-center p-4 rounded-lg bg-muted">
                          <div className="text-2xl font-bold text-primary">{p.problems_count}</div>
                          <div className="text-sm text-muted-foreground">Problems Solved</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted">
                          <div className="text-2xl font-bold text-primary">{p.contest_rating}</div>
                          <div className="text-sm text-muted-foreground">Contest Rating</div>
                        </div>
                        <div className="col-span-2 text-center p-4 rounded-lg bg-muted">
                           <div className="text-sm text-muted-foreground mb-2">Badges</div>
                           <div className="flex flex-wrap gap-2 justify-center">
                             {p.badges?.slice(0, 5).map((b: any) => <Badge key={b.name} variant="secondary">{b.name}</Badge>)}
                           </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No platforms synced yet.</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="/settings">Connect a platform</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Today's Tasks
              </CardTitle>
              <CardDescription>Recommended by your AI coach</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.duration_minutes ? `${session.duration_minutes}min` : 'Study session'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Continue
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No tasks for today</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">87</div>
                  <div className="text-sm text-muted-foreground">Problems Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4.2h</div>
                  <div className="text-sm text-muted-foreground">Avg Daily</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">92%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Completed Binary Tree chapter</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Star className="h-4 w-4 text-primary" />
                <span>Achieved 90% on algorithms quiz</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Scheduled review session</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;