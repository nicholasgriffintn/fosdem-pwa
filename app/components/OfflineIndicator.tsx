"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { useOnlineStatus } from "~/hooks/use-online-status";
import { useAuth } from "~/hooks/use-auth";
import { getSyncQueue } from "~/lib/localStorage";
import { checkAndSyncOnOnline, registerBackgroundSync } from "~/lib/backgroundSync";
import { cn } from "~/lib/utils";
import { Wifi, WifiOff, RefreshCw, Cloud, CheckCircle, AlertCircle } from "lucide-react";

export function OfflineIndicator() {
	const [isMounted, setIsMounted] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
	const isOnline = useOnlineStatus();
	const { user } = useAuth();

	// biome-ignore lint/correctness/useExhaustiveDependencies: This is intentionally set to always run
	useEffect(() => {
		setIsMounted(true);

		registerBackgroundSync();

		const handleOnline = () => {
			setIsVisible(true);
			setSyncStatus('syncing');

			syncOfflineData();

			setTimeout(() => {
				setIsVisible(false);
				setSyncStatus('idle');
			}, 5000);
		};

		const handleOffline = () => {
			setIsVisible(true);
			setSyncStatus('idle');
		};

		if (isOnline) {
			handleOnline();
		} else {
			handleOffline();
		}

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		const handleServiceWorkerMessage = (event: MessageEvent) => {
			if (event.data?.type === 'TRIGGER_BACKGROUND_SYNC') {
				syncOfflineData();
			}
		};

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
		}

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);

			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
			}
		};
	}, [isOnline]);

	const syncOfflineData = async () => {
		try {
			await checkAndSyncOnOnline(user?.id);

			const syncQueue = getSyncQueue();

			if (syncQueue.length === 0) {
				setSyncStatus('success');
			} else {
				setSyncStatus('error');
			}
		} catch (error) {
			console.error('Sync failed:', error);
			setSyncStatus('error');
		}
	};

	const getSyncIcon = () => {
		switch (syncStatus) {
			case 'syncing':
				return <RefreshCw className="h-3 w-3 animate-spin" />;
			case 'success':
				return <CheckCircle className="h-3 w-3 text-green-600" />;
			case 'error':
				return <AlertCircle className="h-3 w-3 text-red-600" />;
			default:
				return <Cloud className="h-3 w-3" />;
		}
	};

	const getSyncText = () => {
		switch (syncStatus) {
			case 'syncing':
				return 'Syncing...';
			case 'success':
				return 'Synced';
			case 'error':
				return 'Sync Failed';
			default:
				return 'Offline';
		}
	};

	if (!isMounted || !isVisible) return null;

	return (
		<div className={cn(
			"fixed bottom-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300",
			"bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3"
		)}>
			<div className="flex items-center gap-2">
				{isOnline ? (
					<Wifi className="h-4 w-4 text-green-600" />
				) : (
					<WifiOff className="h-4 w-4 text-orange-600" />
				)}
				<span className="text-sm font-medium">
					{isOnline ? "Back Online" : "Offline Mode"}
				</span>
			</div>

			{!isOnline && (
				<Button
					size="sm"
					variant="outline"
					onClick={() => { window.location.href = "/offline"; }}
				>
					View Offline
				</Button>
			)}

			{isOnline && syncStatus !== 'idle' && (
				<div className="flex items-center gap-1">
					{getSyncIcon()}
					<span className="text-xs text-muted-foreground">
						{getSyncText()}
					</span>
				</div>
			)}

			{isOnline && (
				<Button
					size="sm"
					variant="outline"
					onClick={() => window.location.reload()}
				>
					<RefreshCw className="h-3 w-3 mr-1" />
					Refresh
				</Button>
			)}
		</div>
	);
}
