import { FC, useEffect, useRef, useState } from 'react';
import { TouchApp } from '@mui/icons-material';
import { CounterUser } from '@shared/schema';

interface UserCounterCardProps {
  user: CounterUser;
  isCurrentUser: boolean;
}

const UserCounterCard: FC<UserCounterCardProps> = ({ user, isCurrentUser }) => {
  const [highlight, setHighlight] = useState(false);
  const prevCountRef = useRef(user.count);
  
  useEffect(() => {
    // Check if the count has changed
    if (prevCountRef.current !== user.count) {
      setHighlight(true);
      
      // Remove highlight after animation completes
      const timer = setTimeout(() => {
        setHighlight(false);
      }, 1200);
      
      // Update previous count
      prevCountRef.current = user.count;
      
      return () => clearTimeout(timer);
    }
  }, [user.count]);
  
  return (
    <div 
      className={`counter-card bg-white rounded-lg shadow-1 p-4 border-l-4 
        ${isCurrentUser ? 'border-primary' : 'border-secondary'}
        ${highlight ? 'highlight' : ''}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-foreground">
          {user.name} {isCurrentUser ? '(You)' : ''}
        </span>
        <span className="text-xs text-white bg-primary-light rounded-full px-2 py-0.5">
          #{user.id.substring(0, 4)}
        </span>
      </div>
      <div className="flex items-center mt-2">
        <TouchApp className="text-secondary mr-2" />
        <span className="text-2xl font-medium text-foreground">{user.count}</span>
      </div>
    </div>
  );
};

export default UserCounterCard;
