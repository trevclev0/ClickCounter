import { FC, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { CounterButton } from "../components/CounterButton";
import { UserCounterCard } from "../components/UserCounterCard";
import { ConnectionInfo } from "../components/ConnectionInfo";
import { Groups } from "@mui/icons-material";
import { ThemeToggle } from "../components/ThemeToggle";
import { ConnectionToggle } from "../components/ConnectionToggle";
import { NameChangeDialog } from "../components/NameChangeDialog";

const Home: FC = () => {
  const {
    isConnected,
    userId,
    userCount,
    connectedUsers,
    websocketInfo,
    incrementCounter,
    toggleConnection,
    updateDisplayName,
  } = useWebSocket();

  return (
    <div className="flex flex-col min-h-screen">
      {/* App Bar */}
      <header className="bg-primary text-primary-foreground shadow-lg z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-medium">Rage Click</h1>
          <div className="flex items-center space-x-2">
            <ConnectionToggle
              isConnected={isConnected}
              onToggle={toggleConnection}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Counter Section */}
          <div className="flex flex-col items-center justify-center mb-10">
            <CounterButton count={userCount} onIncrement={incrementCounter} />

            {/* User Profile Controls */}
            {userId && isConnected && (
              <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center p-4 border border-border rounded-lg bg-card/50">
                <div className="flex items-center">
                  {/* Find current user by userId and use their name for the dialog */}
                  {(() => {
                    const currentUser = connectedUsers.find(user => user.id === userId);
                    if (currentUser) {
                      console.log('Found current user in list:', currentUser.id, currentUser.name);
                      return (
                        <NameChangeDialog
                          currentName={currentUser.name}
                          onNameChange={updateDisplayName}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
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
              {connectedUsers.map((user) => (
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
          <p>
            Click Counter App | Built with React, Material UI, and WebSockets
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
