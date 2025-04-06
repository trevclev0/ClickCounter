import { FC } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from '@/components/ConnectionStatus';
import CounterButton from '@/components/CounterButton';
import UserCounterCard from '@/components/UserCounterCard';
import ConnectionInfo from '@/components/ConnectionInfo';
import { Groups } from '@mui/icons-material';

const Home: FC = () => {
  const { 
    isConnected, 
    userId, 
    userCount, 
    connectedUsers, 
    websocketInfo, 
    incrementCounter 
  } = useWebSocket();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* App Bar */}
      <header className="bg-primary text-primary-foreground shadow-lg z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-medium">Click Counter</h1>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Counter Section */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium text-foreground mb-2">Your Click Counter</h2>
              <p className="text-muted-foreground">
                Click the button to increase your counter and share with others
              </p>
            </div>
            
            <CounterButton count={userCount} onIncrement={incrementCounter} />
          </div>
          
          {/* Users List */}
          <div className="bg-card rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-medium text-foreground mb-4 flex items-center">
              <Groups className="mr-2 text-primary-light" />
              <span>Connected Users</span>
              <span className="ml-2 bg-primary text-primary-foreground text-sm px-2 py-0.5 rounded-full">
                {connectedUsers.length}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {connectedUsers.map(user => (
                <UserCounterCard 
                  key={user.id} 
                  user={user} 
                  isCurrentUser={user.id === userId}
                />
              ))}
            </div>
          </div>
          
          {/* Connection Info */}
          <ConnectionInfo websocketInfo={websocketInfo} />
        </div>
      </main>
      
      <footer className="bg-card py-4 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Click Counter App | Built with React, Material UI, and WebSockets</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
