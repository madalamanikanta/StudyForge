import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Clock, Award, Calendar, BookOpen, Zap, Download } from 'lucide-react';

const Progress = () => {
  const weeklyData = [
    { day: 'Mon', hours: 2.5, target: 3 },
    { day: 'Tue', hours: 3.2, target: 3 },
    { day: 'Wed', hours: 1.8, target: 3 },
    { day: 'Thu', hours: 4.1, target: 3 },
    { day: 'Fri', hours: 2.7, target: 3 },
    { day: 'Sat', hours: 3.5, target: 3 },
    { day: 'Sun', hours: 2.2, target: 3 }
  ];

  const subjects = [
    { name: 'Data Structures', completed: 85, total: 100, hours: 24.5, recent: 'Arrays & Lists' },
    { name: 'Algorithms', completed: 72, total: 120, hours: 31.2, recent: 'Sorting & Searching' },
    { name: 'System Design', completed: 45, total: 80, hours: 18.7, recent: 'Load Balancing' },
    { name: 'Database Design', completed: 38, total: 60, hours: 15.3, recent: 'Normalization' }
  ];

  const achievements = [
    { title: '7 Day Streak', icon: Zap, color: 'bg-warning', earned: true },
    { title: 'Problem Solver', icon: Target, color: 'bg-success', earned: true },
    { title: 'Early Bird', icon: Clock, color: 'bg-primary', earned: false },
    { title: 'Marathon', icon: Award, color: 'bg-destructive', earned: false }
  ];

  const stats = {
    totalHours: 89.7,
    sessionsCompleted: 47,
    currentStreak: 12,
    longestStreak: 18,
    averageSession: 1.9,
    weeklyGoal: 21,
    weeklyActual: 19.8
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress Analytics</h1>
          <p className="text-muted-foreground">Track your learning journey and achievements</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalHours}h</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold text-foreground">{stats.sessionsCompleted}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{stats.currentStreak} days</p>
              </div>
              <div className="w-12 h-12 bg-warning-light rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold text-foreground">{stats.averageSession}h</p>
              </div>
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              This Week's Progress
            </CardTitle>
            <CardDescription>
              {stats.weeklyActual}h of {stats.weeklyGoal}h goal completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Weekly Goal</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((stats.weeklyActual / stats.weeklyGoal) * 100)}%
                </span>
              </div>
              <ProgressBar value={(stats.weeklyActual / stats.weeklyGoal) * 100} className="h-3" />
              
              <div className="grid grid-cols-7 gap-2 mt-6">
                {weeklyData.map((day) => (
                  <div key={day.day} className="text-center">
                    <div className="text-xs text-muted-foreground mb-2">{day.day}</div>
                    <div className="h-20 bg-muted rounded-lg relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-primary transition-all duration-300"
                        style={{ height: `${Math.min((day.hours / day.target) * 100, 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-end justify-center pb-1">
                        <span className="text-xs font-medium text-foreground">{day.hours}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-warning" />
              Achievements
            </CardTitle>
            <CardDescription>Your learning milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.title}
                    className={`p-4 rounded-lg border transition-all ${
                      achievement.earned
                        ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      achievement.earned ? achievement.color : 'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${achievement.earned ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <h4 className={`font-medium text-sm ${
                      achievement.earned ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.title}
                    </h4>
                    {achievement.earned && (
                      <Badge className="mt-2 bg-success text-success-foreground text-xs">
                        Earned
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-success" />
            Subject Progress
          </CardTitle>
          <CardDescription>Detailed breakdown by subject area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {subjects.map((subject) => (
              <div key={subject.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-foreground">{subject.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{subject.hours}h studied</span>
                        <span>{subject.completed}/{subject.total} topics</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Last studied: {subject.recent}</p>
                  </div>
                </div>
                <ProgressBar value={(subject.completed / subject.total) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;