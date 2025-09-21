import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Mock data focused on programming/coding subjects
const subjects = [
  { name: 'Data Structures & Algorithms', progress: 85 },
  { name: 'System Design', progress: 70 },
  { name: 'Web Development', progress: 90 },
  { name: 'Machine Learning', progress: 60 },
  { name: 'Competitive Programming', progress: 75 },
];

const SubjectProgress = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.name}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{subject.name}</span>
                <span className="text-sm font-medium">{subject.progress}%</span>
              </div>
              <Progress value={subject.progress} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectProgress;
