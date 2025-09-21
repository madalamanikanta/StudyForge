import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, Clock, BookOpen, Trash2, Edit, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  goal: string;
  difficulty_level: string;
  hours_per_week: number;
  timeline_days: number;
  status: string;
  created_at: string;
}

const StudyPlans = () => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    goal: '',
    difficulty_level: 'intermediate',
    hours_per_week: 10,
    timeline_days: 30
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStudyPlans = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch study plans",
        variant: "destructive",
      });
    } else {
      setStudyPlans(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudyPlans();
  }, [user]);

  const createStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from('study_plans')
      .insert({
        ...newPlan,
        user_id: user.id,
        ai_generated: false,
        status: 'active'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create study plan",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Study plan created successfully!",
      });
      setIsCreateOpen(false);
      setNewPlan({
        title: '',
        description: '',
        goal: '',
        difficulty_level: 'intermediate',
        hours_per_week: 10,
        timeline_days: 30
      });
      fetchStudyPlans();
    }
  };

  const deleteStudyPlan = async (id: string) => {
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete study plan",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Study plan deleted successfully!",
      });
      fetchStudyPlans();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'paused': return 'bg-warning';
      case 'completed': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-muted-foreground">Loading study plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Plans</h1>
          <p className="text-muted-foreground">Create and manage your personalized learning roadmaps</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Study Plan</DialogTitle>
              <DialogDescription>
                Design a personalized study plan to achieve your learning goals.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createStudyPlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  placeholder="e.g., Data Structures & Algorithms"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goal">Learning Goal</Label>
                <Input
                  id="goal"
                  value={newPlan.goal}
                  onChange={(e) => setNewPlan({ ...newPlan, goal: e.target.value })}
                  placeholder="e.g., Master algorithm optimization"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder="Describe your study plan objectives..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={newPlan.difficulty_level}
                    onValueChange={(value) => setNewPlan({ ...newPlan, difficulty_level: value })}
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
                
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours per Week</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={newPlan.hours_per_week}
                    onChange={(e) => setNewPlan({ ...newPlan, hours_per_week: parseInt(e.target.value) })}
                    min={1}
                    max={40}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline (Days)</Label>
                <Input
                  id="timeline"
                  type="number"
                  value={newPlan.timeline_days}
                  onChange={(e) => setNewPlan({ ...newPlan, timeline_days: parseInt(e.target.value) })}
                  min={7}
                  max={365}
                />
              </div>
              
              <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                Create Study Plan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {studyPlans.length === 0 ? (
        <Card className="shadow-medium">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No study plans yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first study plan to start your learning journey
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyPlans.map((plan) => (
            <Card key={plan.id} className="shadow-medium hover:shadow-large transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <CardDescription className="mt-1">{plan.goal}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Badge className={`${getDifficultyColor(plan.difficulty_level)} text-white text-xs`}>
                      {plan.difficulty_level}
                    </Badge>
                    <Badge className={`${getStatusColor(plan.status)} text-white text-xs`}>
                      {plan.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-muted-foreground">{plan.hours_per_week}h/week</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-2 text-success" />
                      <span className="text-muted-foreground">{plan.timeline_days} days</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteStudyPlan(plan.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyPlans;