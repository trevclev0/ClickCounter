import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SignalWifi4Bar, SignalWifiOff, CloudDone, CloudOff } from '@mui/icons-material';

export interface WebSocketInfo {
  status: string;
  server: string;
  latency: number;
}

interface ConnectionInfoProps {
  websocketInfo: WebSocketInfo;
}

export function ConnectionInfo({ websocketInfo }: ConnectionInfoProps) {
  const isConnected = websocketInfo.status === 'connected';
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-medium flex items-center">
            {isConnected ? (
              <SignalWifi4Bar className="mr-2 text-green-500" />
            ) : (
              <SignalWifiOff className="mr-2 text-red-500" />
            )}
            Connection Status
          </CardTitle>
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="px-3 py-1 text-xs"
          >
            {websocketInfo.status}
          </Badge>
        </div>
        <CardDescription>Details about your WebSocket connection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <CloudDone className="text-green-500" />
            ) : (
              <CloudOff className="text-red-500" />
            )}
            <div className="text-sm">
              <span className="font-medium">Server:</span> {websocketInfo.server || 'Not connected'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">Latency:</span>
            {isConnected ? (
              <Badge variant="outline" className="px-2 py-0.5 text-xs">
                {websocketInfo.latency} ms
              </Badge>
            ) : (
              <Badge variant="outline" className="px-2 py-0.5 text-xs">
                N/A
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}