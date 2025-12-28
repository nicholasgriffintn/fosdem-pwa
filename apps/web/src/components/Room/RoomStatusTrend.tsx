"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Icons } from "~/components/shared/Icons";
import { getRoomStatusHistory } from "~/server/functions/room-status";
import { cn } from "~/lib/utils";

type RoomTrend = "filling" | "emptying" | "stable" | "unknown";

type RoomStatusTrendProps = {
  roomId: string;
  className?: string;
};

function calculateTrend(
  history: Array<{ state: "full" | "available" | "unknown"; recordedAt: string }>
): RoomTrend {
  if (!history || history.length < 2) {
    return "unknown";
  }

  const total = history.length;
  const fullCount = history.filter((h) => h.state === "full").length;
  const availableCount = history.filter((h) => h.state === "available").length;

  if (fullCount / total > 0.6) {
    const recentHalf = history.slice(0, Math.floor(total / 2));
    const olderHalf = history.slice(Math.floor(total / 2));
    const recentFullRate =
      recentHalf.filter((h) => h.state === "full").length / recentHalf.length;
    const olderFullRate =
      olderHalf.filter((h) => h.state === "full").length / olderHalf.length;

    if (recentFullRate > olderFullRate) {
      return "filling";
    }
  }

  if (availableCount / total > 0.6) {
    const recentHalf = history.slice(0, Math.floor(total / 2));
    const olderHalf = history.slice(Math.floor(total / 2));
    const recentAvailableRate =
      recentHalf.filter((h) => h.state === "available").length / recentHalf.length;
    const olderAvailableRate =
      olderHalf.filter((h) => h.state === "available").length / olderHalf.length;

    if (recentAvailableRate > olderAvailableRate) {
      return "emptying";
    }
  }

  return "stable";
}

const trendConfig: Record<
  RoomTrend,
  { icon: keyof typeof Icons; label: string; className: string }
> = {
  filling: {
    icon: "trendingUp",
    label: "Filling up",
    className: "text-orange-600",
  },
  emptying: {
    icon: "trendingDown",
    label: "Emptying",
    className: "text-green-600",
  },
  stable: {
    icon: "minus",
    label: "Stable",
    className: "text-gray-600",
  },
  unknown: {
    icon: "minus",
    label: "Unknown",
    className: "text-gray-400",
  },
};

export function RoomStatusTrend({ roomId, className }: RoomStatusTrendProps) {
  const fetchHistory = useServerFn(getRoomStatusHistory);

  const { data: history, isLoading } = useQuery({
    queryKey: ["roomStatusHistory", roomId],
    queryFn: () => fetchHistory({ data: { roomName: roomId, limit: 10 } }),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (isLoading || !history) {
    return null;
  }

  const trend = calculateTrend(history);
  
  if (trend === "unknown") {
    return null;
  }

  const config = trendConfig[trend];
  const Icon = Icons[config.icon];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        config.className,
        className
      )}
      title={`Room is ${config.label.toLowerCase()}`}
    >
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
}
