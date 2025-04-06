import { FC } from 'react';
import { Wifi } from '@mui/icons-material';

interface WebSocketInfo {
  status: string;
  server: string;
  latency: number;
}

interface ConnectionInfoProps {
  websocketInfo: WebSocketInfo;
}

const ConnectionInfo: FC<ConnectionInfoProps> = ({ websocketInfo }) => {
  const getStatusColor = () => {
    switch (websocketInfo.status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-background-paper rounded-lg shadow-1 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Wifi className="text-primary mr-2" />
          <span className="text-sm text-muted-foreground">WebSocket Status</span>
        </div>
        <div className={`px-3 py-1 ${getStatusColor()} rounded-full text-xs font-medium`}>
          {websocketInfo.status.charAt(0).toUpperCase() + websocketInfo.status.slice(1)}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground flex justify-between">
        <span>Server: {websocketInfo.server}</span>
        <span>Latency: {websocketInfo.latency}ms</span>
      </div>
    </div>
  );
};

export default ConnectionInfo;
