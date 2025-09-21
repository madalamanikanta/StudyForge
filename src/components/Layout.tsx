import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Home, Calendar, BookOpen, TrendingUp, Settings, Users, Download, Zap, Star, User as UserIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const Layout = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [demoMode] = useState(() => localStorage.getItem('studyforge-demo-mode') === 'true');

  // Enable demo mode if no user is authenticated
  if (!user && !demoMode) {
    return <Navigate to="/" replace />;
  }

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Study Plans', href: '/dashboard/plans', icon: BookOpen },
    { name: 'AI Coach', href: '/dashboard/ai-coach', icon: Brain },
    { name: 'Peer Rooms', href: '/dashboard/peer-rooms', icon: Users },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
    { name: 'Snap Exports', href: '/dashboard/snapshots', icon: Download },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img src="/favicon.svg" alt="StudyForge Logo" className="w-12 h-12 self-center" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">StudyForge</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Study Planning</p>
              </div>
            </Link>

            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-4">
                <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              </nav>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  12 day streak
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  1,250 points
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.['avatar_url']} alt={user?.email} />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.user_metadata?.['display_name'] || user?.email || 'Demo User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || 'demo@studyforge.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {location.pathname.startsWith('/dashboard') && (
          <nav className="w-64 bg-card border-r h-[calc(100vh-81px)] sticky top-[81px] p-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;