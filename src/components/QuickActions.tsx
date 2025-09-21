import { Plus, Timer, BookOpen, Target, Download, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const QuickActions = () => {
  const actions = [
    {
      icon: Plus,
      label: "New Study Plan",
      description: "Create AI-generated roadmap",
      variant: "default" as const,
      className: "bg-gradient-primary text-primary-foreground hover:opacity-90"
    },
    {
      icon: Timer,
      label: "Start Timer",
      description: "Begin focused study session",
      variant: "outline" as const
    },
    {
      icon: BookOpen,
      label: "Quick Review",
      description: "Review recent topics",
      variant: "outline" as const
    },
    {
      icon: Target,
      label: "Set Goal",
      description: "Define new learning objective",
      variant: "outline" as const
    },
    {
      icon: Download,
      label: "Export Report",
      description: "Download study snapshot PDF",
      variant: "outline" as const
    },
    {
      icon: Settings,
      label: "Preferences",
      description: "Customize study settings",
      variant: "outline" as const
    }
  ];

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>
          Streamline your study workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                className={`justify-start h-auto p-3 ${action.className || ''}`}
              >
                <div className="flex items-center space-x-3 w-full">
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs opacity-70 truncate">{action.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Keyboard Shortcuts Hint */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Keyboard shortcuts:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Plan:</span>
              <kbd className="px-1 bg-muted rounded text-foreground">Ctrl+N</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timer:</span>
              <kbd className="px-1 bg-muted rounded text-foreground">Ctrl+T</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Review:</span>
              <kbd className="px-1 bg-muted rounded text-foreground">Ctrl+R</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settings:</span>
              <kbd className="px-1 bg-muted rounded text-foreground">Ctrl+,</kbd>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};