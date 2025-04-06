import { FC } from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center">
      <span 
        className={`inline-block w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 pulse' : 'bg-red-500'} mr-2`} 
      />
      <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
};

export default ConnectionStatus;
