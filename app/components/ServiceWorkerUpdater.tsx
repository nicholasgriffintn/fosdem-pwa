"use client";

import { useEffect } from "react";

import { toast } from "~/hooks/use-toast";
import { Button } from "~/components/ui/button";

export function ServiceWorkerUpdater() {
	useEffect(() => {
		const handleBeforeInstallPrompt = (e: any) => {
			e.preventDefault();

			if (window.matchMedia("(display-mode: standalone)").matches) {
				return;
			}
		};

		const handleAppInstalled = () => {
			toast({
				title: "Successfully Installed",
				description: "FOSDEM PWA has been added to your home screen",
				duration: 3000,
			});
			localStorage.removeItem("installPromptDismissed");
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		window.addEventListener("appinstalled", handleAppInstalled);

		const handleSwUpdate = () => {
			toast({
				title: "Update Available",
				description: "A new version is available. Click to update.",
				duration: 0,
				action: (
					<Button
						variant="outline"
						onClick={() => {
							navigator.serviceWorker.controller?.postMessage({
								type: "SKIP_WAITING",
							});
							window.location.reload();
						}}
					>
						Update
					</Button>
				),
			});
		};

		const supportsBroadcastChannel =
			typeof window !== "undefined" && "BroadcastChannel" in window;

		const dataChannel = supportsBroadcastChannel
			? new BroadcastChannel("fosdem-data-updates")
			: null;

		if (dataChannel) {
			dataChannel.onmessage = () => {
				toast({
					title: "New Data Available",
					description: "Refresh to see the latest content.",
					duration: 5000,
				});
			};
		}

		const serverFunctionsChannel = supportsBroadcastChannel
			? new BroadcastChannel("server-functions-sync")
			: null;

		if (serverFunctionsChannel) {
			serverFunctionsChannel.onmessage = (event) => {
				if (event.data?.type === "SYNC_COMPLETE") {
					toast({
						title: "Offline requests processed",
						description:
							"Requests that were queued while offline have been processed",
						duration: 3000,
					});
				}
			};
		}

		window.addEventListener("swUpdated", handleSwUpdate);

		return () => {
			window.removeEventListener("swUpdated", handleSwUpdate);
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
			dataChannel?.close();
			serverFunctionsChannel?.close();
		};
	}, []);

	return null;
}
