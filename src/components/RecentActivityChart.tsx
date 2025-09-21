import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// TODO: Replace with real data from the backend
const data = [
  { name: 'Mon', lessons: 4 },
  { name: 'Tue', lessons: 3 },
  { name: 'Wed', lessons: 5 },
  { name: 'Thu', lessons: 2 },
  { name: 'Fri', lessons: 6 },
  { name: 'Sat', lessons: 1 },
  { name: 'Sun', lessons: 0 },
];

const RecentActivityChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="lessons" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityChart;
