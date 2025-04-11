import React from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Person } from "@mui/icons-material";
import type { CounterUser } from "@shared/schema";

interface UserCounterCardProps {
  user: CounterUser;
  isCurrentUser: boolean;
}

export function UserCounterCard({ user, isCurrentUser }: UserCounterCardProps) {
  // Generate a unique color based on the user ID for the avatar
  const generateColorFromId = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const avatarColor = generateColorFromId(user.id);
  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <Card className="overflow-hidden transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-10 w-10"
              style={{ backgroundColor: avatarColor }}
            >
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{user.name}</p>
                {isCurrentUser && <Badge className="text-xs px-2">You</Badge>}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <Person className="h-3 w-3 mr-1" />
                <span className="truncate">{user.id}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Counter Value</span>
          <span className="text-2xl font-bold text-primary">{user.count}</span>
        </div>
      </CardContent>
    </Card>
  );
}
