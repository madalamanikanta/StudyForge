import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Share2,
  FileText,
  Calendar,
  TrendingUp,
  Target,
  Clock,
  Eye,
  Trash2,
  Plus,
  Star,
  Award,
  Brain
} from 'lucide-react';

interface StudySnapshot {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'custom';
  include_progress: boolean;
  include_plans: boolean;
  include_calendar: boolean;
  date_range: {
    start: string;
    end: string;
  };
  status: 'generating' | 'completed' | 'failed';
  download_url?: string;
  created_at: string;
  updated_at: string;
}

const Snapshots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<StudySnapshot[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'weekly' as 'weekly' | 'monthly' | 'custom',
    include_progress: true,
    include_plans: true,
    include_calendar: true,
    date_range: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    // Mock data for demonstration
    const mockSnapshots: StudySnapshot[] = [
      {
        id: '1',
        title: 'Weekly Progress Report - Week 3',
        description: 'Comprehensive overview of study progress and achievements',
        type: 'weekly',
        include_progress: true,
        include_plans: true,
        include_calendar: true,
        date_range: {
          start: '2024-01-14',
          end: '2024-01-20'
        },
        status: 'completed',
        download_url: '/snapshots/weekly-report-3.pdf',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:05:00Z'
      },
      {
        id: '2',
        title: 'Monthly Study Summary - January 2024',
        description: 'Complete analysis of monthly learning patterns and goals',
        type: 'monthly',
        include_progress: true,
        include_plans: false,
        include_calendar: true,
        date_range: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        status: 'completed',
        download_url: '/snapshots/monthly-summary-jan-2024.pdf',
        created_at: '2024-01-31T15:00:00Z',
        updated_at: '2024-01-31T15:10:00Z'
      },
      {
        id: '3',
        title: 'Custom Report - System Design Focus',
        description: 'Detailed analysis focusing on system design learning progress',
        type: 'custom',
        include_progress: true,
        include_plans: true,
        include_calendar: false,
        date_range: {
          start: '2024-01-10',
          end: '2024-01-25'
        },
        status: 'generating',
        created_at: '2024-01-25T12:00:00Z',
        updated_at: '2024-01-25T12:00:00Z'
      }
    ];

    setSnapshots(mockSnapshots);
  };

  const handleGenerateSnapshot = async () => {
    if (!createForm.title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your snapshot",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      // Mock snapshot generation
      const newSnapshot: StudySnapshot = {
        id: Date.now().toString(),
        title: createForm.title,
        description: createForm.description,
        type: createForm.type,
        include_progress: createForm.include_progress,
        include_plans: createForm.include_plans,
        include_calendar: createForm.include_calendar,
        date_range: createForm.date_range as { start: string; end: string },
        status: 'generating',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSnapshots(prev => [newSnapshot, ...prev]);

      // Simulate generation process
      setTimeout(() => {
        setSnapshots(prev =>
          prev.map(s =>
            s.id === newSnapshot.id
              ? { ...s, status: 'completed' as const, download_url: `/snapshots/${s.id}.pdf` }
              : s
          )
        );
        toast({
          title: "Snapshot Generated!",
          description: "Your study snapshot is ready for download"
        });
      }, 3000);

      setShowCreateDialog(false);
      setCreateForm({
        title: '',
        description: '',
        type: 'weekly',
        include_progress: true,
        include_plans: true,
        include_calendar: true,
        date_range: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate snapshot",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (snapshot: StudySnapshot) => {
    if (snapshot.status !== 'completed') {
      toast({
        title: "Not Ready",
        description: "Snapshot is still generating",
        variant: "destructive"
      });
      return;
    }

    // Mock download
    toast({
      title: "Download Started",
      description: `Downloading ${snapshot.title}...`
    });
  };

  const handleShare = (snapshot: StudySnapshot) => {
    // Mock share functionality
    navigator.clipboard.writeText(`Check out my study progress: ${snapshot.title}`);
    toast({
      title: "Link Copied",
      description: "Snapshot link copied to clipboard"
    });
  };

  const handleDelete = (snapshotId: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
    toast({
      title: "Snapshot Deleted",
      description: "Study snapshot has been removed"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'monthly': return <TrendingUp className="h-4 w-4" />;
      case 'custom': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Snapshots</h1>
          <p className="text-muted-foreground">Generate comprehensive progress reports and export your learning journey</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Generate Snapshot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate Study Snapshot</DialogTitle>
              <DialogDescription>
                Create a comprehensive report of your study progress and achievements
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Snapshot Title</label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Progress Report"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief description of the snapshot"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={createForm.type} onValueChange={(value: 'weekly' | 'monthly' | 'custom') => setCreateForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                    <SelectItem value="monthly">Monthly Summary</SelectItem>
                    <SelectItem value="custom">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Include Sections</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createForm.include_progress}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, include_progress: e.target.checked }))}
                    />
                    <span className="text-sm">Progress Analytics</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createForm.include_plans}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, include_plans: e.target.checked }))}
                    />
                    <span className="text-sm">Study Plans</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createForm.include_calendar}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, include_calendar: e.target.checked }))}
                    />
                    <span className="text-sm">Calendar Events</span>
                  </label>
                </div>
              </div>
              {createForm.type === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      value={createForm.date_range.start}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, date_range: { ...prev.date_range, start: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <input
                      type="date"
                      value={createForm.date_range.end}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, date_range: { ...prev.date_range, end: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              )}
              <Button
                onClick={handleGenerateSnapshot}
                disabled={generating}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {generating ? 'Generating...' : 'Generate Snapshot'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{snapshots.length}</p>
              <p className="text-sm text-muted-foreground">Total Snapshots</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {snapshots.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Ready to Download</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {snapshots.filter(s => s.status === 'generating').length}
              </p>
              <p className="text-sm text-muted-foreground">Generating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Share2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {snapshots.filter(s => s.include_progress).length}
              </p>
              <p className="text-sm text-muted-foreground">With Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshots List */}
      <div className="space-y-4">
        {snapshots.map((snapshot) => (
          <Card key={snapshot.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    {getTypeIcon(snapshot.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{snapshot.title}</h3>
                      <Badge className={getStatusColor(snapshot.status)}>
                        {snapshot.status}
                      </Badge>
                    </div>
                    {snapshot.description && (
                      <p className="text-muted-foreground mb-3">{snapshot.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{snapshot.date_range.start} to {snapshot.date_range.end}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>{snapshot.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {snapshot.include_progress && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Progress</span>}
                        {snapshot.include_plans && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Plans</span>}
                        {snapshot.include_calendar && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Calendar</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {snapshot.status === 'completed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(snapshot)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(snapshot)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {snapshot.status === 'generating' && (
                    <Button variant="outline" size="sm" disabled>
                      <Clock className="h-4 w-4 mr-1" />
                      Generating...
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(snapshot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {snapshots.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No snapshots yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Generate your first study snapshot to track your progress and share your achievements.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Snapshot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Snapshots;
