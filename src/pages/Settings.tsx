import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Bell,
  Link,
  Shield,
  Palette,
  LogOut
} from 'lucide-react';

interface Profile {
  display_name: string;
  email: string;
  timezone: string;
  study_preferences: {
    daily_goal_hours: number;
    preferred_study_time: string;
    difficulty_preference: string;
    reminder_frequency: string;
  };
}

const PLATFORMS = [
  { id: 'leetcode', name: 'LeetCode', icon: '💻' },
  { id: 'hackerrank', name: 'HackerRank', icon: '🧑‍💻' },
  { id: 'codeforces', name: 'Codeforces', icon: '🚀' },
  { id: 'codechef', name: 'CodeChef', icon: '🌶️' },
  { id: 'atcoder', name: 'AtCoder', icon: '🇯🇵' },
] as const;

type Platform = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
};

const Settings = () => {
  const [profile, setProfile] = useState<Profile>({
    display_name: '',
    email: '',
    timezone: 'UTC',
    study_preferences: {
      daily_goal_hours: 2,
      preferred_study_time: '18:00',
      difficulty_preference: 'medium',
      reminder_frequency: 'daily'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [syncLoading, setSyncLoading] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState({
    study_reminders: true,
    progress_updates: true,
    achievement_alerts: true,
    email_notifications: false
  });

  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    if (!user) return;

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      // Provide demo integration data
      setUsernames({
        leetcode: 'demo_user',
        hackerrank: '',
        codeforces: '',
        codechef: '',
        atcoder: ''
      });
      return;
    }

    try {
      const { data } = await supabase
        .from('imports')
        .select('platform, username')
        .eq('user_id', user.id);

      if (data) {
        const userNamesData = data.reduce<Record<string, string>>((acc, item) => {
          acc[item.platform] = item.username;
          return acc;
        }, {});
        setUsernames(userNamesData);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error; // Re-throw to be caught by the caller
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      // Provide demo data
      setProfile({
        display_name: 'Demo User',
        email: 'demo@studyforge.com',
        timezone: 'UTC',
        study_preferences: {
          daily_goal_hours: 2,
          preferred_study_time: '18:00',
          difficulty_preference: 'medium',
          reminder_frequency: 'daily'
        }
      });
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        // Ensure study_preferences has the correct shape
        const studyPrefs = typeof data.study_preferences === 'object' && data.study_preferences !== null
          ? data.study_preferences as Profile['study_preferences']
          : {
              daily_goal_hours: 2,
              preferred_study_time: '18:00',
              difficulty_preference: 'medium',
              reminder_frequency: 'daily'
            };

        setProfile({
          display_name: data.display_name || '',
          email: data.email || user.email || '',
          timezone: data.timezone || 'UTC',
          study_preferences: studyPrefs
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error; // Re-throw to be caught by the caller
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      await Promise.all([fetchProfile(), fetchIntegrations()]);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please refresh the page.',
        variant: 'destructive'
      });
    }
  }, [user, fetchProfile, fetchIntegrations, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user) return;

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      // Simulate save operation in demo mode
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        toast({
          title: 'Demo Mode',
          description: 'Settings saved locally (demo mode). Changes won\'t persist.',
        });
      }, 1000);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          timezone: profile.timezone,
          study_preferences: profile.study_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your profile has been updated.'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (platform: string, value: string) => {
    setUsernames(prev => ({ ...prev, [platform]: value }));
  };

  const handleSync = async (platform: string) => {
    const username = usernames[platform]?.trim();
    if (!username) {
      toast({
        title: "Username required",
        description: `Please enter your ${platform} username.`,
        variant: "destructive"
      });
      return;
    }

    setSyncLoading(prev => ({ ...prev, [platform]: true }));

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      // Simulate sync operation in demo mode
      setTimeout(() => {
        const mockProblemCount = Math.floor(Math.random() * 100) + 50;
        toast({
          title: `Demo: Successfully synced with ${platform}!`,
          description: `Mock data: Found ${mockProblemCount} solved problems.`,
        });
        setSyncLoading(prev => ({ ...prev, [platform]: false }));
      }, 2000);
      return;
    }

    try {
      // Show loading state
      toast({
        title: `Syncing ${platform} data...`,
        description: "This may take a moment.",
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('import-scores', {
        body: {
          platform: platform.toLowerCase(),
          username
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to sync with the server');
      }

      if (!data) {
        throw new Error('No data received from the server');
      }

      // Update the UI with the new data
      if (data.record) {
        const problemCount = data.record.problems_count || 0;
        toast({
          title: `Successfully synced with ${platform}!`,
          description: problemCount > 0
            ? `Found ${problemCount} solved problems.`
            : 'No new problems found.'
        });

        // Refresh the integrations list
        await fetchIntegrations();
      } else {
        toast({
          title: `Successfully connected to ${platform}!`,
          description: 'Your data will be processed shortly.'
        });
      }

    } catch (error: unknown) {
      console.error(`Error syncing with ${platform}:`, error);

      let errorMessage = 'An unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Provide more user-friendly error messages
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'User not found. Please check your username and try again.';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Too many requests. Please try again later.';
      }

      toast({
        title: `Failed to sync with ${platform}`,
        description: errorMessage,
        variant: 'destructive',
        duration: 5000 // Show for 5 seconds
      });

    } finally {
      setSyncLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleSignOut = () => {
    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      // In demo mode, just clear the demo flag and redirect to home
      localStorage.removeItem('studyforge-demo-mode');
      window.location.href = '/';
      return;
    }

    signOut().catch(error => {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and study preferences</p>
        {localStorage.getItem('studyforge-demo-mode') === 'true' && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Demo Mode
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and study preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={profile.timezone} 
                      onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily_goal">Daily Goal (hours)</Label>
                    <Input
                      id="daily_goal"
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={profile.study_preferences.daily_goal_hours}
                      onChange={(e) => setProfile({
                        ...profile,
                        study_preferences: {
                          ...profile.study_preferences,
                          daily_goal_hours: parseFloat(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="study_time">Preferred Study Time</Label>
                    <Select 
                      value={profile.study_preferences.preferred_study_time}
                      onValueChange={(value) => setProfile({
                        ...profile,
                        study_preferences: {
                          ...profile.study_preferences,
                          preferred_study_time: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (6-12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12-6 PM)</SelectItem>
                        <SelectItem value="evening">Evening (6-10 PM)</SelectItem>
                        <SelectItem value="night">Night (10 PM-2 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Preference</Label>
                    <Select 
                      value={profile.study_preferences.difficulty_preference}
                      onValueChange={(value) => setProfile({
                        ...profile,
                        study_preferences: {
                          ...profile.study_preferences,
                          difficulty_preference: value
                        }
                      })}
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
                </div>

                <Button 
                  type="submit" 
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2 text-warning" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose when and how you'd like to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="study_reminders" className="font-medium">Study Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified about scheduled study sessions</p>
                </div>
                <Switch
                  id="study_reminders"
                  checked={notifications.study_reminders}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, study_reminders: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="progress_updates" className="font-medium">Progress Updates</Label>
                  <p className="text-sm text-muted-foreground">Weekly progress and goal tracking updates</p>
                </div>
                <Switch
                  id="progress_updates"
                  checked={notifications.progress_updates}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, progress_updates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="achievement_alerts" className="font-medium">Achievement Alerts</Label>
                  <p className="text-sm text-muted-foreground">Celebrate your learning milestones</p>
                </div>
                <Switch
                  id="achievement_alerts"
                  checked={notifications.achievement_alerts}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, achievement_alerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications" className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, email_notifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Actions */}
        <div className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="w-5 h-5 mr-2 text-blue-500" />
                Integrations
              </CardTitle>
              <CardDescription>
                Connect your accounts from other platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {PLATFORMS.map((p: Platform) => (
                <div key={p.id} className="space-y-2">
                   <Label htmlFor={`${p.id}_username`}>{p.icon} {p.name}</Label>
                   <div className="flex gap-2">
                     <Input
                       id={`${p.id}_username`}
                       value={usernames[p.id] || ''}
                       onChange={(e) => handleUsernameChange(p.id, e.target.value)}
                       placeholder={`Your ${p.name} username`}
                     />
                     <Button
                       onClick={() => handleSync(p.id)}
                       disabled={syncLoading[p.id]}
                       variant="outline"
                     >
                       {syncLoading[p.id] ? '...' : 'Sync'}
                     </Button>
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-success" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download Data
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2 text-secondary-accent" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible account actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Signing out will end your current session. You can sign back in anytime.
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="outline" 
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;