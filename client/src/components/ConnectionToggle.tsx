import React from "react";
import { Button } from "./ui/button";
import { SignalWifi4Bar, SignalWifiOff } from "@mui/icons-material";

interface ConnectionToggleProps {
  isConnected: boolean;
  onToggle: () => void;
}

export function ConnectionToggle({
  isConnected,
  onToggle,
}: ConnectionToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="h-9 w-9 rounded-full"
      title={isConnected ? "Disconnect" : "Connect"}
    >
      {isConnected ? (
        <SignalWifi4Bar className="h-5 w-5" />
      ) : (
        <SignalWifiOff className="h-5 w-5 text-red-400" />
      )}
    </Button>
  );
}
