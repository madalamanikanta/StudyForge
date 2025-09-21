import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Brain, Target, BarChart } from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleDemoMode = () => {
    // Set a demo flag in localStorage to enable demo mode
    localStorage.setItem('studyforge-demo-mode', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/favicon.svg" alt="StudyForge Logo" className="h-8 w-8" />
          <span className="text-2xl font-bold">StudyForge</span>
        </div>
        <nav className="space-x-4">
          <Button variant="ghost" asChild>
            <a href="/auth">Sign In</a>
          </Button>
          <Button asChild>
            <a href="/auth">Get Started</a>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            Master Any Subject with Your AI-Powered Study Companion
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your learning with AI-generated study roadmaps, adaptive scheduling, and intelligent progress tracking. Study smarter, not harder.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/auth">Start Learning for Free</a>
            </Button>
            <Button size="lg" variant="outline" onClick={handleDemoMode}>
              Try Demo Mode
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No sign-up required • Explore all features • Demo data included
          </p>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold">Why StudyForge?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to conquer your learning goals.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <img src="/favicon.svg" alt="StudyForge Logo" className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">AI Study Roadmaps</h3>
                <p className="text-muted-foreground">
                  Get a personalized, step-by-step plan to achieve your learning objectives, powered by AI.
                </p>
              </div>
              <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Adaptive Learning</h3>
                <p className="text-muted-foreground">
                  Our smart system adjusts to your progress, ensuring you're always learning effectively.
                </p>
              </div>
              <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <BarChart className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Visualize your growth, identify weak spots, and stay motivated with detailed analytics.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 StudyForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
