import { Bot, Send, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const AICoach = () => {
  const [suggestions, setSuggestions] = useState([
    {
      type: "tip",
      message: "Based on your progress, focus on tree traversal algorithms next. They're fundamental for your upcoming goals.",
      time: "2 minutes ago"
    },
    {
      type: "reminder",
      message: "You learn best between 2-4 PM. Consider scheduling complex topics during this time.",
      time: "1 hour ago"
    }
  ]);

  const generateStudyPath = () => {
    const newSuggestion = {
      type: "path",
      message: "New study path generated: Focus on advanced data structures for the next 2 weeks.",
      time: "Just now"
    };
    setSuggestions([newSuggestion, ...suggestions]);
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Bot className="w-5 h-5 mr-2 text-secondary-accent" />
          AI Coach
        </CardTitle>
        <CardDescription>Your intelligent study companion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* AI Suggestions */}
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-secondary/30 rounded-lg border border-secondary">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-secondary-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      {suggestion.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input 
                placeholder="Ask your AI coach anything..." 
                className="flex-1"
              />
              <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Try asking: "What should I study next?" or "How am I progressing?"
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              Explain my progress
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Adjust schedule
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Study tips
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={generateStudyPath}>
              Generate Study Path
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};