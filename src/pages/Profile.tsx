import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Calendar, Trophy, Target, Clock, Award, BookOpen, Star } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [isDemoMode] = useState(() => localStorage.getItem('studyforge-demo-mode') === 'true');

  // Mock data for demo mode or when user data is not available
  const userInfo = user ? {
    name: user.user_metadata?.['display_name'] || user.email?.split('@')[0] || 'User',
    email: user.email || 'user@example.com',
    joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
    avatar: user.user_metadata?.['avatar_url'] || '/favicon.svg',
  } : {
    name: 'Demo User',
    email: 'demo@studyforge.com',
    joinDate: 'January 2024',
    avatar: '/favicon.svg',
  };

  const stats = [
    { label: 'Study Sessions', value: '127', icon: BookOpen, color: 'text-blue-600' },
    { label: 'Hours Studied', value: '89', icon: Clock, color: 'text-green-600' },
    { label: 'Goals Achieved', value: '23', icon: Target, color: 'text-purple-600' },
    { label: 'Current Streak', value: '12 days', icon: Trophy, color: 'text-orange-600' },
  ];

  const achievements = [
    { name: 'First Steps', description: 'Completed your first study session', earned: true },
    { name: 'Week Warrior', description: 'Studied for 7 days in a row', earned: true },
    { name: 'Knowledge Seeker', description: 'Completed 50 study sessions', earned: true },
    { name: 'Time Master', description: 'Studied for 100+ hours total', earned: false },
    { name: 'Goal Crusher', description: 'Achieved 25 learning goals', earned: false },
    { name: 'Study Champion', description: 'Maintained a 30-day streak', earned: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Your learning journey and achievements</p>
        {isDemoMode && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Demo Mode
          </div>
        )}
      </div>

      {/* User Info Card */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {userInfo.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{userInfo.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium text-foreground">{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Joined {userInfo.joinDate}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Star className="h-3 w-3 mr-1" />
                  1,250 points
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Trophy className="h-3 w-3 mr-1" />
                  12 day streak
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <Target className="h-3 w-3 mr-1" />
                  23 goals achieved
                </Badge>
              </div>
            </div>

            <Button variant="outline" className="self-start sm:self-center">
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Learning Statistics
            </CardTitle>
            <CardDescription>
              Your study progress at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-muted/50">
                  <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-warning" />
              Recent Achievements
            </CardTitle>
            <CardDescription>
              Your latest learning milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.slice(0, 4).map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    achievement.earned
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  }`}>
                    {achievement.earned ? (
                      <Award className="h-4 w-4" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${achievement.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {achievement.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {achievement.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Preferences Summary */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-success" />
            Study Preferences
          </CardTitle>
          <CardDescription>
            Your personalized learning settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold text-foreground">2 hours</div>
              <div className="text-sm text-muted-foreground">Daily Goal</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="font-semibold text-foreground">Evening</div>
              <div className="text-sm text-muted-foreground">Study Time</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="font-semibold text-foreground">Intermediate</div>
              <div className="text-sm text-muted-foreground">Difficulty</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="font-semibold text-foreground">Daily</div>
              <div className="text-sm text-muted-foreground">Reminders</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
