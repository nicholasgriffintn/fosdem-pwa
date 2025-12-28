"use client";

import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Icons } from "~/components/shared/Icons";
import { cn } from "~/lib/utils";

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

type PlaybackSpeedControlProps = {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "compact" | "icon";
};

export function PlaybackSpeedControl({
  currentSpeed,
  onSpeedChange,
  disabled,
  className,
  variant = "default",
}: PlaybackSpeedControlProps) {
  const [open, setOpen] = useState(false);

  const handleSpeedSelect = (speed: number) => {
    onSpeedChange(speed);
    setOpen(false);
  };

  const formatSpeed = (speed: number) => {
    return speed === 1 ? "1x" : `${speed}x`;
  };

  if (variant === "icon") {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn("h-8 w-8 p-0", className)}
            aria-label={`Playback speed: ${formatSpeed(currentSpeed)}`}
          >
            <Icons.gauge className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {PLAYBACK_SPEEDS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => handleSpeedSelect(speed)}
              className={cn(
                "cursor-pointer",
                speed === currentSpeed && "bg-accent font-medium"
              )}
            >
              {formatSpeed(speed)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "compact") {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn("gap-1 h-7 px-2 text-xs", className)}
          >
            <Icons.gauge className="h-3 w-3" />
            {formatSpeed(currentSpeed)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {PLAYBACK_SPEEDS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => handleSpeedSelect(speed)}
              className={cn(
                "cursor-pointer text-sm",
                speed === currentSpeed && "bg-accent font-medium"
              )}
            >
              {formatSpeed(speed)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("gap-2", className)}
        >
          <Icons.gauge className="h-4 w-4" />
          Speed: {formatSpeed(currentSpeed)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PLAYBACK_SPEEDS.map((speed) => (
          <DropdownMenuItem
            key={speed}
            onClick={() => handleSpeedSelect(speed)}
            className={cn(
              "cursor-pointer",
              speed === currentSpeed && "bg-accent font-medium"
            )}
          >
            {formatSpeed(speed)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
