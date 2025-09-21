import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain,
  MessageCircle,
  Lightbulb,
  Target,
  BookOpen,
  Send,
  Plus,
  ThumbsUp
} from 'lucide-react';
type SessionType = 'question' | 'explanation' | 'strategy' | 'review';
type DifficultyType = 'beginner' | 'intermediate' | 'advanced';
type StatusType = 'active' | 'completed' | 'archived';

interface CoachingSession {
  id: string;
  title: string;
  type: SessionType;
  status: StatusType;
  difficulty: DifficultyType;
  topic: string;
  created_at: string;
  last_interaction: string;
  message_count: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  helpful?: boolean;
}

const AICoach = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [createForm, setCreateForm] = useState<{
    title: string;
    type: SessionType;
    topic: string;
    difficulty: DifficultyType;
  }>({
    title: '',
    type: 'question',
    topic: '',
    difficulty: 'intermediate'
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    // Mock data for demonstration
    const mockSessions: CoachingSession[] = [
      {
        id: '1',
        title: 'Understanding Dynamic Programming',
        type: 'explanation',
        status: 'active',
        difficulty: 'intermediate',
        topic: 'Algorithms',
        created_at: '2024-01-15T10:00:00Z',
        last_interaction: '2024-01-20T14:30:00Z',
        message_count: 12
      },
      {
        id: '2',
        title: 'System Design Interview Prep',
        type: 'strategy',
        status: 'active',
        difficulty: 'advanced',
        topic: 'System Design',
        created_at: '2024-01-18T09:00:00Z',
        last_interaction: '2024-01-20T16:45:00Z',
        message_count: 8
      },
      {
        id: '3',
        title: 'React Hooks Best Practices',
        type: 'review',
        status: 'completed',
        difficulty: 'intermediate',
        topic: 'Web Development',
        created_at: '2024-01-10T15:00:00Z',
        last_interaction: '2024-01-15T11:20:00Z',
        message_count: 15
      }
    ];

    setSessions(mockSessions);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.topic.trim()) return;

    const newSession: CoachingSession = {
      id: Date.now().toString(),
      title: createForm.title,
      type: createForm.type,
      status: 'active',
      difficulty: createForm.difficulty,
      topic: createForm.topic,
      created_at: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
      message_count: 0
    };

    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession);
    setShowNewSessionDialog(false);

    // Reset form with proper type safety
    setCreateForm(prev => ({
      ...prev,
      title: '',
      type: 'question',
      topic: '',
      difficulty: 'intermediate'
    }));

    // Add welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hi! I'm your AI Study Coach. I'm here to help you with "${newSession.title}". What would you like to know or work on today?`,
      timestamp: new Date().toISOString()
    };

    setMessages([welcomeMessage]);
  };

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a simulated response to: ${newMessage}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [newMessage, selectedSession, toast]);


  const handleMarkHelpful = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, helpful: !msg.helpful } : msg
      )
    );
  }, []);

  const getTypeIcon = (type: SessionType | undefined): JSX.Element => {
    switch (type) {
      case 'question': return <MessageCircle className="h-4 w-4" />;
      case 'explanation': return <Lightbulb className="h-4 w-4" />;
      case 'strategy': return <Target className="h-4 w-4" />;
      case 'review': return <BookOpen className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: DifficultyType | undefined): string => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: StatusType | undefined): string => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setCreateForm(prev => ({
      ...prev,
      ...(name === 'title' || name === 'topic' ? { [name]: value } : 
         name === 'type' ? { type: value as SessionType } :
         name === 'difficulty' ? { difficulty: value as DifficultyType } :
         {})
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Study Coach</h1>
          <p className="text-muted-foreground">Get personalized guidance and explanations from your AI mentor</p>
        </div>
        <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start New Coaching Session</DialogTitle>
              <DialogDescription>
                Create a focused session with your AI study coach
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Title</label>
                <Input
                  placeholder="e.g., Understanding Dynamic Programming"
                  value={createForm.title}
                  onChange={handleInputChange}
                  name="title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic</label>
                <Input
                  placeholder="e.g., Data Structures, Algorithms, System Design"
                  value={createForm.topic}
                  onChange={handleInputChange}
                  name="topic"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Type</label>
                  <Select value={createForm.type} onValueChange={(value: 'question' | 'explanation' | 'strategy' | 'review') => setCreateForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">Ask Questions</SelectItem>
                      <SelectItem value="explanation">Get Explanations</SelectItem>
                      <SelectItem value="strategy">Study Strategy</SelectItem>
                      <SelectItem value="review">Review Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={createForm.difficulty} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setCreateForm(prev => ({ ...prev, difficulty: value }))}>
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
              <Button onClick={handleCreateSession} className="w-full">
                Start Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSession?.id === session.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedSession(session);
                    setMessages([{
                      id: '1',
                      role: 'assistant',
                      content: `Hi! I'm your AI Study Coach. I'm here to help you with "${session.title}". What would you like to know or work on today?`,
                      timestamp: new Date().toISOString()
                    }]);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(session.type)}
                      <span className="text-sm font-medium">{session.title}</span>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-3">
                      <span>{session.topic}</span>
                      <Badge className={getDifficultyColor(session.difficulty)} variant="outline">
                        {session.difficulty}
                      </Badge>
                    </div>
                    <span>{session.message_count} messages</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedSession.title}</CardTitle>
                      <CardDescription>
                        {selectedSession.topic} • {selectedSession.type} • {selectedSession.difficulty}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedSession.status)}>
                    {selectedSession.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4 border rounded-lg bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMarkHelpful(message.id)}
                            >
                              <ThumbsUp className={`h-3 w-3 ${message.helpful ? 'text-green-600' : 'text-gray-400'}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border shadow-sm p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask me anything about your topic..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !newMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Brain className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Session</h3>
                <p className="text-muted-foreground mb-4">
                  Choose an existing session from the sidebar or create a new one to start chatting with your AI coach.
                </p>
                <Button onClick={() => setShowNewSessionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Session
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICoach;
