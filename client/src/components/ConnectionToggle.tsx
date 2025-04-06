import React from 'react';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { SignalWifi4Bar, SignalWifiOff } from '@mui/icons-material';
import { ConnectionStatus } from './ConnectionStatus';

interface ConnectionToggleProps {
  isConnected: boolean;
  onToggle: () => void;
}

export function ConnectionToggle({ isConnected, onToggle }: ConnectionToggleProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Switch
          checked={isConnected}
          onCheckedChange={onToggle}
          id="connection-mode"
        />
        <label
          htmlFor="connection-mode"
          className="text-sm font-medium cursor-pointer"
        >
          Connection
        </label>
      </div>
      
      <Button
        variant={isConnected ? "destructive" : "default"}
        size="sm"
        onClick={onToggle}
        className="h-8 px-3"
      >
        {isConnected ? (
          <>
            <SignalWifiOff className="mr-1 h-4 w-4" />
            Disconnect
          </>
        ) : (
          <>
            <SignalWifi4Bar className="mr-1 h-4 w-4" />
            Connect
          </>
        )}
      </Button>
      
      <ConnectionStatus isConnected={isConnected} />
    </div>
  );
}