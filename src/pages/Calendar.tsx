import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, getDay, addMonths, subMonths } from 'date-fns';

interface StudyEvent {
  id: string;
  title: string;
  type: 'practice' | 'review' | 'learn';
  time: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock events data
  const events: Record<string, StudyEvent[]> = {
    [format(new Date(), 'yyyy-MM-dd')]: [
      { id: '1', title: 'Binary Trees Practice', type: 'practice', time: '09:00', duration: 45, priority: 'high' },
      { id: '2', title: 'Hash Maps Review', type: 'review', time: '14:30', duration: 20, priority: 'medium' },
      { id: '3', title: 'Dynamic Programming', type: 'learn', time: '19:00', duration: 30, priority: 'low' }
    ],
    [format(addMonths(new Date(), 0).setDate(15), 'yyyy-MM-dd')]: [
      { id: '4', title: 'Algorithms Quiz', type: 'practice', time: '10:00', duration: 60, priority: 'high' }
    ]
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty cells for days before the month starts
  const startPadding = getDay(monthStart);
  const paddedDays = [
    ...Array(startPadding).fill(null),
    ...calendarDays
  ];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events[format(date, 'yyyy-MM-dd')] || [];
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'practice': return 'bg-primary';
      case 'review': return 'bg-warning';
      case 'learn': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive';
      case 'medium': return 'border-l-warning';
      case 'low': return 'border-l-success';
      default: return 'border-l-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Calendar</h1>
          <p className="text-muted-foreground">Schedule and track your study sessions</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Add Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-16 p-1" />;
                  }
                  
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  
                  return (
                    <div
                      key={format(day, 'yyyy-MM-dd')}
                      className={`h-16 p-1 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'
                      } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium ${
                        isToday(day) ? 'text-primary font-bold' : 'text-foreground'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`w-full h-1 rounded-full ${getEventTypeColor(event.type)}`}
                          />
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Events */}
        <div className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE, MMMM d')}
              </CardTitle>
              <CardDescription>
                {getEventsForDate(selectedDate).length} study sessions scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No sessions scheduled</p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Add Session
                    </Button>
                  </div>
                ) : (
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 border-l-4 bg-muted/30 rounded-r-lg ${getPriorityColor(event.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{event.title}</h4>
                          <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                            <span>•</span>
                            <span>{event.duration}min</span>
                          </div>
                        </div>
                        <Badge className={`${getEventTypeColor(event.type)} text-white text-xs`}>
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Study Stats */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions Completed</span>
                  <span className="font-medium text-foreground">8/12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hours Studied</span>
                  <span className="font-medium text-foreground">6.5h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="font-medium text-success">12 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;