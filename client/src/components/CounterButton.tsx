import React, { useState } from "react";
import { Button } from "./ui/button";
import { Mouse } from "@mui/icons-material";

interface CounterButtonProps {
  count: number;
  onIncrement: () => void;
  disabled: boolean;
}

export function CounterButton({
  count,
  onIncrement,
  disabled,
}: CounterButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onIncrement();

    // Remove animation class after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl font-bold mb-4 text-primary">
        <span className={isAnimating ? "animate-bounce" : ""}>{count}</span>
      </div>

      <Button
        size="lg"
        onClick={handleClick}
        disabled={disabled}
        className="bg-primary hover:bg-primary/90 text-primary-foreground p-8 h-auto transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl rounded-full"
      >
        <Mouse style={{ height: 32, width: 32 }} />
      </Button>
    </div>
  );
}
