import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// TODO: Replace with real data from the backend
const users = [
  { name: 'Alice', points: 5400, avatar: '/avatars/01.png' },
  { name: 'Bob', points: 4800, avatar: '/avatars/02.png' },
  { name: 'Charlie', points: 4500, avatar: '/avatars/03.png' },
  { name: 'David', points: 3200, avatar: '/avatars/04.png' },
  { name: 'Eve', points: 2100, avatar: '/avatars/05.png' },
];

const Leaderboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user, index) => (
            <div key={user.name} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold">{index + 1}</span>
                <Avatar>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.name}</span>
              </div>
              <span className="font-bold">{user.points} pts</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
