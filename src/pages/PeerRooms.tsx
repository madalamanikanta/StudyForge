import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  Clock,
  MessageCircle,
  Play,
  Plus,
  Search,
  Calendar,
  Target,
  Globe
} from 'lucide-react';

interface StudyRoom {
  id: string;
  title: string;
  description: string;
  topic: string;
  duration_minutes: number;
  max_participants: number;
  current_participants: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  timezone: string;
  scheduled_time: string;
  host_id: string;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

const PeerRooms = () => {
  const { user } = useAuth();
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<StudyRoom[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    topic: '',
    duration_minutes: 30,
    max_participants: 4,
    difficulty_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    scheduled_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  useEffect(() => {
    fetchStudyRooms();
  }, []);

  useEffect(() => {
    let filtered = studyRooms;

    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.topic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(room => room.topic === selectedTopic);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(room => room.difficulty_level === selectedDifficulty);
    }

    setFilteredRooms(filtered);
  }, [studyRooms, searchTerm, selectedTopic, selectedDifficulty]);

  const fetchStudyRooms = async () => {
    // Mock data for demonstration
    const mockRooms: StudyRoom[] = [
      {
        id: '1',
        title: 'Data Structures Deep Dive',
        description: 'Focusing on advanced tree structures and graph algorithms',
        topic: 'Data Structures',
        duration_minutes: 60,
        max_participants: 6,
        current_participants: 3,
        difficulty_level: 'advanced',
        timezone: 'UTC',
        scheduled_time: '2024-01-20T14:00:00Z',
        host_id: 'user1',
        status: 'upcoming',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        title: 'System Design Basics',
        description: 'Learn how to design scalable systems from scratch',
        topic: 'System Design',
        duration_minutes: 45,
        max_participants: 4,
        current_participants: 4,
        difficulty_level: 'intermediate',
        timezone: 'America/New_York',
        scheduled_time: '2024-01-20T18:00:00Z',
        host_id: 'user2',
        status: 'active',
        created_at: '2024-01-15T11:00:00Z'
      },
      {
        id: '3',
        title: 'React Hooks Masterclass',
        description: 'Master all React hooks with practical examples',
        topic: 'Web Development',
        duration_minutes: 30,
        max_participants: 5,
        current_participants: 2,
        difficulty_level: 'intermediate',
        timezone: 'Asia/Tokyo',
        scheduled_time: '2024-01-20T10:00:00Z',
        host_id: 'user3',
        status: 'upcoming',
        created_at: '2024-01-15T12:00:00Z'
      }
    ];

    setStudyRooms(mockRooms);
  };

  const handleCreateRoom = async () => {
    // Mock room creation
    const newRoom: StudyRoom = {
      id: Date.now().toString(),
      title: createForm.title,
      description: createForm.description,
      topic: createForm.topic,
      duration_minutes: createForm.duration_minutes,
      max_participants: createForm.max_participants,
      current_participants: 1,
      difficulty_level: createForm.difficulty_level,
      timezone: createForm.timezone,
      scheduled_time: createForm.scheduled_time,
      host_id: user?.id || 'current_user',
      status: 'upcoming',
      created_at: new Date().toISOString()
    };

    setStudyRooms(prev => [newRoom, ...prev]);
    setShowCreateDialog(false);
    setCreateForm({
      title: '',
      description: '',
      topic: '',
      duration_minutes: 30,
      max_participants: 4,
      difficulty_level: 'intermediate',
      scheduled_time: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Peer Study Rooms</h1>
          <p className="text-muted-foreground">Join focused study sessions with fellow learners</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Study Room</DialogTitle>
              <DialogDescription>
                Set up a focused study session with other learners
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Room Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Data Structures Deep Dive"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the session"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Select value={createForm.topic} onValueChange={(value) => setCreateForm(prev => ({ ...prev, topic: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Data Structures">Data Structures</SelectItem>
                      <SelectItem value="Algorithms">Algorithms</SelectItem>
                      <SelectItem value="System Design">System Design</SelectItem>
                      <SelectItem value="Web Development">Web Development</SelectItem>
                      <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={createForm.difficulty_level} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setCreateForm(prev => ({ ...prev, difficulty_level: value }))}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={createForm.duration_minutes.toString()} onValueChange={(value) => setCreateForm(prev => ({ ...prev, duration_minutes: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Max Participants</Label>
                  <Select value={createForm.max_participants.toString()} onValueChange={(value) => setCreateForm(prev => ({ ...prev, max_participants: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 people</SelectItem>
                      <SelectItem value="4">4 people</SelectItem>
                      <SelectItem value="6">6 people</SelectItem>
                      <SelectItem value="8">8 people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Scheduled Time</Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={createForm.scheduled_time}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreateRoom} className="w-full">
                Create Study Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search study rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              <SelectItem value="Data Structures">Data Structures</SelectItem>
              <SelectItem value="Algorithms">Algorithms</SelectItem>
              <SelectItem value="System Design">System Design</SelectItem>
              <SelectItem value="Web Development">Web Development</SelectItem>
              <SelectItem value="Machine Learning">Machine Learning</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Study Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{room.title}</CardTitle>
                  <CardDescription className="mt-1">{room.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{room.topic}</span>
                </div>
                <Badge className={getDifficultyColor(room.difficulty_level)}>
                  {room.difficulty_level}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{room.duration_minutes}min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{room.current_participants}/{room.max_participants}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(room.scheduled_time).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{room.timezone}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={room.status === 'active' || room.current_participants >= room.max_participants}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {room.status === 'active' ? 'Join Live' : 'Join Session'}
                </Button>
                {room.status === 'active' && (
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No study rooms found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search filters or create a new study room to get started.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Room
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PeerRooms;
