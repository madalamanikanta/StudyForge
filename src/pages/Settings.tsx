import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
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

  const [notifications, setNotifications] = useState({
    study_reminders: true,
    progress_updates: true,
    achievement_alerts: true,
    email_notifications: false
  });

  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [syncLoading, setSyncLoading] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const PLATFORMS = [
    { id: 'leetcode', name: 'LeetCode', icon: '💻' },
    { id: 'hackerrank', name: 'HackerRank', icon: '🧑‍💻' },
    { id: 'codeforces', name: 'Codeforces', icon: '🚀' },
    { id: 'codechef', name: 'CodeChef', icon: '🌶️' },
    { id: 'atcoder', name: 'AtCoder', icon: '🇯🇵' },
  ];

  useEffect(() => {
    if (user) {
      // Load user profile data
      const loadProfile = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data) {
            setProfile({
              display_name: data.display_name || '',
              email: data.email || user.email || '',
              timezone: data.timezone || 'UTC',
              study_preferences: data.study_preferences || profile.study_preferences
            });
          }

          // Load integration data
          const { data: integrationData } = await supabase
            .from('imports')
            .select('platform, username')
            .eq('user_id', user.id);

          if (integrationData) {
            const userNamesData = integrationData.reduce<Record<string, string>>((acc, item) => {
              acc[item.platform] = item.username;
              return acc;
            }, {});
            setUsernames(userNamesData);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      };

      loadProfile();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
        await loadProfile();
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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords don't match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      setPasswordLoading(true);
      setTimeout(() => {
        toast({
          title: "Demo Mode",
          description: "Password changed successfully (demo mode).",
        });
        setShowPasswordDialog(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordLoading(false);
      }, 1500);
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "2FA toggled successfully (demo mode).",
      });
      setShow2FADialog(false);
      return;
    }

    // In a real implementation, this would integrate with an authenticator service
    toast({
      title: "Feature Coming Soon",
      description: "Two-factor authentication will be available in a future update.",
    });
    setShow2FADialog(false);
  };

  const handleDownloadData = async () => {
    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('studyforge-demo-mode') === 'true';

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Data export initiated (demo mode).",
      });
      return;
    }

    try {
      // In a real implementation, this would generate and download user data
      toast({
        title: "Feature Coming Soon",
        description: "Data export will be available in a future update.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate data export.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = () => {
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
              {/* Current Email Display - Prominent */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Current Account Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">{profile.email}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                    Primary
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  This is your primary account email address
                </p>
              </div>

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
              {PLATFORMS.map((p) => (
                <div key={p.id} className="space-y-2">
                  <Label htmlFor={`${p.id}_username`}>{p.icon} {p.name}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${p.id}_username`}
                      value={usernames[p.id] || ''}
                      onChange={(e) => setUsernames(prev => ({ ...prev, [p.id]: e.target.value }))}
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
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowPasswordDialog(true)}>
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShow2FADialog(true)}>
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleDownloadData}>
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
                <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme. System will automatically switch between light and dark based on your device settings.
                </p>
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

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Two-factor authentication adds an extra layer of security to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Two-factor authentication is not yet implemented in this demo. In a production environment,
                this would integrate with an authenticator app or SMS service.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleToggle2FA} className="flex-1">
                Enable 2FA
              </Button>
              <Button
                variant="outline"
                onClick={() => setShow2FADialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
