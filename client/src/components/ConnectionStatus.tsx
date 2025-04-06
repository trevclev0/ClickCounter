import React from 'react';
import { Badge } from './ui/badge';
import { SignalWifi4Bar, SignalWifiOff } from '@mui/icons-material';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <Badge
      variant={isConnected ? "default" : "destructive"}
      className="inline-flex items-center gap-1"
    >
      {isConnected ? (
        <>
          <SignalWifi4Bar fontSize="small" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <SignalWifiOff fontSize="small" />
          <span>Disconnected</span>
        </>
      )}
    </Badge>
  );
}