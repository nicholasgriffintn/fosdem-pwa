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

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		window.addEventListener("appinstalled", () => {
			toast({
				title: "Successfully Installed",
				description: "FOSDEM PWA has been added to your home screen",
				duration: 3000,
			});
			localStorage.removeItem("installPromptDismissed");
		});

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

		const dataChannel = new BroadcastChannel("fosdem-data-updates");
		dataChannel.onmessage = (event) => {
			toast({
				title: "New Data Available",
				description: "Refresh to see the latest content.",
				duration: 5000,
			});
		};

		/* const syncChannel = new BroadcastChannel("user-data-sync");
		syncChannel.onmessage = (event) => {
			if (event.data.type === "SYNC_COMPLETE") {
				toast({
					title: "Sync Complete",
					description: "Your changes have been saved.",
					duration: 3000,
				});
			}
		}; */

		const serverFunctionsChannel = new BroadcastChannel(
			"server-functions-sync",
		);
		serverFunctionsChannel.onmessage = (event) => {
			if (event.data.type === "SYNC_COMPLETE") {
				toast({
					title: "Offline requests processed",
					description:
						"Requests that were queued while offline have been processed",
					duration: 3000,
				});
			}
		};

		window.addEventListener("swUpdated", handleSwUpdate);

		return () => {
			window.removeEventListener("swUpdated", handleSwUpdate);
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", () => {});
			dataChannel.close();
			// syncChannel.close();
			serverFunctionsChannel.close();
		};
	}, []);

	return null;
}
