"use client";

import { AlertCircle, CheckCircle, Cloud, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingState } from "~/components/shared/LoadingState";
import { useAuth } from "~/hooks/use-auth";
import { useOnlineStatus } from "~/hooks/use-online-status";
import {
	checkAndSyncOnOnline,
	registerBackgroundSync,
} from "~/lib/backgroundSync";
import { getSyncQueue } from "~/lib/localStorage";
import { cn } from "~/lib/utils";

export function OfflineIndicator() {
	const [isMounted, setIsMounted] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "success" | "error"
	>("idle");
	const wasOfflineRef = useRef(false);
	const isOnline = useOnlineStatus();
	const { user } = useAuth();

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const syncOfflineData = useCallback(async () => {
		try {
			await checkAndSyncOnOnline(user?.id);

			const syncQueue = await getSyncQueue();

			if (syncQueue.length === 0) {
				setSyncStatus("success");
			} else {
				setSyncStatus("error");
			}
		} catch (error) {
			console.error("Sync failed:", error);
			setSyncStatus("error");
		}
	}, [user?.id]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		registerBackgroundSync();

		let resetTimeoutId: number | undefined;
		let isCleanedUp = false;

		const handleOnline = () => {
			if (wasOfflineRef.current && !isCleanedUp) {
				setIsVisible(true);
				setSyncStatus("syncing");

				void syncOfflineData().finally(() => {
					if (isCleanedUp) return;

					if (resetTimeoutId !== undefined) {
						window.clearTimeout(resetTimeoutId);
					}
					resetTimeoutId = window.setTimeout(() => {
						if (isCleanedUp) return;
						setIsVisible(false);
						setSyncStatus("idle");
					}, 5000);
				});
			}
			wasOfflineRef.current = false;
		};

		const handleOffline = () => {
			if (isCleanedUp) return;
			setIsVisible(true);
			setSyncStatus("idle");
			wasOfflineRef.current = true;
		};

		const serviceWorkerMessageHandler = (event: MessageEvent) => {
			if (event.data?.type === "TRIGGER_BACKGROUND_SYNC" && !isCleanedUp) {
				void syncOfflineData();
			}
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener(
				"message",
				serviceWorkerMessageHandler,
			);
		}

		if (window.navigator.onLine) {
			handleOnline();
		} else {
			handleOffline();
		}

		return () => {
			isCleanedUp = true;

			if (typeof window === "undefined") {
				return;
			}

			if (resetTimeoutId !== undefined) {
				window.clearTimeout(resetTimeoutId);
			}

			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);

			if ("serviceWorker" in navigator) {
				navigator.serviceWorker.removeEventListener(
					"message",
					serviceWorkerMessageHandler,
				);
			}
		};
	}, [syncOfflineData]);

	const getSyncIcon = () => {
		switch (syncStatus) {
			case "syncing":
				return <LoadingState type="spinner" size="sm" variant="inline" />;
			case "success":
				return <CheckCircle className="h-3 w-3 text-green-600" />;
			case "error":
				return <AlertCircle className="h-3 w-3 text-red-600" />;
			default:
				return <Cloud className="h-3 w-3" />;
		}
	};

	const getSyncText = () => {
		switch (syncStatus) {
			case "syncing":
				return "Syncing...";
			case "success":
				return "Synced";
			case "error":
				return "Sync Failed";
			default:
				return "Offline";
		}
	};

	if (!isMounted || !isVisible) return null;

	return (
		<div
			className={cn(
				"fixed bottom-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300",
				"bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3",
			)}
			role="status"
			aria-live="polite"
		>
			<div className="flex items-center gap-2">
				{isOnline ? (
					<Wifi className="h-4 w-4 text-green-600" />
				) : (
					<WifiOff className="h-4 w-4 text-orange-600" />
				)}
				<span className="text-sm font-medium sr-only">
					{isOnline ? "Back Online" : "Offline Mode"}
				</span>
			</div>

			{isOnline && syncStatus !== "idle" && (
				<div className="flex items-center gap-1">
					{getSyncIcon()}
					<span className="text-xs text-muted-foreground">{getSyncText()}</span>
				</div>
			)}
		</div>
	);
}
