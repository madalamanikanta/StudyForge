import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const StudyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const studyDays = [3, 5, 8, 12, 15, 18, 22, 25, 28]; // Example study days
  const today = new Date().getDate();
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Study Calendar
            </CardTitle>
            <CardDescription>Track your study schedule</CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-center text-sm font-medium text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map(day => (
              <div key={day} className="text-xs font-medium text-muted-foreground p-1">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="p-1" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isToday = day === today && currentDate.getMonth() === new Date().getMonth();
              const hasStudy = studyDays.includes(day);
              
              return (
                <div
                  key={day}
                  className={`
                    p-1 text-xs rounded cursor-pointer transition-colors
                    ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                    ${hasStudy && !isToday ? 'bg-success-light text-success font-medium' : ''}
                    ${!hasStudy && !isToday ? 'text-muted-foreground hover:bg-muted' : ''}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between text-xs pt-2 border-t">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-muted-foreground">Study Day</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-muted-foreground">Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};