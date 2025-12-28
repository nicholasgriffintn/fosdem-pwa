"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { toast } from "~/hooks/use-toast";
import { useMutateSubscriptions } from "~/hooks/use-mutate-subscriptions";
import { useSubscriptions } from "~/hooks/use-subscriptions";
import { constants } from "~/constants";
import { urlBase64ToUint8Array } from "~/lib/base64";
import { LoadingState } from "~/components/shared/LoadingState";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "~/components/ui/sheet";
import { NotificationPreferencesContent } from "./NotificationPreferences";

export function PushNotifications() {
	const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();
	const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	const {
		create: createSubscription,
		delete: deleteSubscription,
		createLoading: createSubscriptionLoading,
		deleteLoading: deleteSubscriptionLoading,
	} = useMutateSubscriptions();

	const pushSupported = useMemo(() => {
		if (typeof window === "undefined" || typeof navigator === "undefined") {
			return false;
		}

		return (
			"serviceWorker" in navigator &&
			typeof Notification !== "undefined" &&
			"PushManager" in window
		);
	}, []);

	useEffect(() => {
		if (!pushSupported) {
			return;
		}

		let isMounted = true;

		const checkCurrentSubscription = async () => {
			try {
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();
				if (subscription && isMounted) {
					setCurrentEndpoint(subscription.endpoint);
				}
			} catch (error) {
				console.error("Failed to check current subscription:", error);
			}
		};

		void checkCurrentSubscription();

		return () => {
			isMounted = false;
		};
	}, [pushSupported]);

	const handleSubscribe = useCallback(async () => {
		if (!pushSupported) {
			toast({
				title: "Notifications unsupported",
				description: "Push notifications are not available in this browser.",
			});
			return;
		}

		if (Notification.permission === "denied") {
			toast({
				title: "Notifications blocked",
				description: "Enable notifications in your browser settings first.",
				variant: "destructive",
			});
			return;
		}

		try {
			const permission = await Notification.requestPermission();
			if (permission !== "granted") {
				toast({
					title: "Permission required",
					description: "Please allow notifications to subscribe this device.",
					variant: "destructive",
				});
				return;
			}

			const registration = await navigator.serviceWorker.ready;

			const existingSubscription =
				await registration.pushManager.getSubscription();
			if (existingSubscription) {
				const isAlreadySubscribed = subscriptions?.some(
					(sub) => sub.endpoint === existingSubscription.endpoint,
				);

				if (isAlreadySubscribed) {
					toast({
						title: "Already subscribed",
						description: "This device is already subscribed to notifications",
					});
					return;
				}
			}

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(constants.VAPID_PUBLIC_KEY),
			});

			const subscriptionJSON = subscription.toJSON() as {
				endpoint: string;
				keys: {
					auth: string;
					p256dh: string;
				};
			};

			const {
				endpoint,
				keys: { auth, p256dh },
			} = subscriptionJSON;

			if (!endpoint || !auth || !p256dh) {
				throw new Error("Failed to get subscription details");
			}

			await createSubscription({ endpoint, auth, p256dh });
			setCurrentEndpoint(endpoint);

			toast({
				title: "Subscribed to notifications",
				description:
					"This device will now receive notifications for schedule updates",
			});
		} catch (error) {
			console.error("Error subscribing to push notifications:", error);
			toast({
				title: "Failed to subscribe",
				description:
					"Please check if notifications are enabled in your browser",
				variant: "destructive",
			});
		}
	}, [pushSupported, subscriptions, createSubscription]);

	const handleUnsubscribe = useCallback(async (
		subscriptionId: number,
		endpoint: string,
	) => {
		if (!pushSupported) {
			return;
		}

		try {
			await deleteSubscription({ id: subscriptionId });

			if (endpoint === currentEndpoint) {
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();
				if (subscription) {
					await subscription.unsubscribe();
					setCurrentEndpoint(null);
				}
			}

			toast({
				title: "Unsubscribed from notifications",
				description: "This device will no longer receive notifications",
			});
		} catch (error) {
			console.error("Error unsubscribing from push notifications:", error);
			toast({
				title: "Failed to unsubscribe",
				description: "Please try again",
				variant: "destructive",
			});
		}
	}, [pushSupported, currentEndpoint, deleteSubscription]);

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold text-foreground">Push Notifications</h2>
			{!pushSupported && (
				<p className="text-sm text-muted-foreground">
					This browser does not support push notifications. Try using a
					Chromium-based browser on desktop or Android.
				</p>
			)}
			{subscriptionsLoading ? (
				<LoadingState type="spinner" message="Loading subscriptions..." variant="centered" />
			) : (
				<>
					{subscriptions && subscriptions.length > 0 ? (
						<div className="space-y-4">
							<p>Your subscribed devices:</p>
							<div className="flex flex-col gap-2">
								{subscriptions.map((subscription) => (
									<div
										key={subscription.id}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex flex-col">
											<span>
												Subscription created at{" "}
												{new Date(subscription.created_at).toLocaleString()}
											</span>
											{subscription.endpoint === currentEndpoint && (
												<span className="text-sm text-muted-foreground">
													(Current device)
												</span>
											)}
										</div>
										<Button
											variant="destructive"
											onClick={() =>
												handleUnsubscribe(
													subscription.id,
													subscription.endpoint,
												)
											}
											disabled={deleteSubscriptionLoading || !pushSupported}
										>
											{deleteSubscriptionLoading ? (
												<LoadingState type="spinner" size="sm" variant="inline" />
											) : (
												"Unsubscribe"
											)}
										</Button>
									</div>
								))}
							</div>
							{!currentEndpoint && (
								<div className="flex items-center justify-between py-4 mt-4 border-t">
									<div className="space-y-0.5">
										<Label htmlFor="push-notifications">Add this device</Label>
										<p className="text-sm text-muted-foreground">
											Subscribe this device to receive notifications
										</p>
									</div>
									<Button
										variant="outline"
										onClick={handleSubscribe}
										disabled={createSubscriptionLoading || !pushSupported}
									>
										{createSubscriptionLoading ? (
												<LoadingState type="spinner" size="sm" variant="inline" />
										) : (
											"Subscribe"
										)}
									</Button>
								</div>
							)}
						</div>
					) : (
						<div className="flex items-center justify-between py-4">
							<div className="space-y-0.5">
								<Label htmlFor="push-notifications">
									Subscribe to push notifications
								</Label>
								<p className="text-sm text-muted-foreground">
									You'll receive notifications for when events from your
									schedule are starting.
								</p>
							</div>
							<Button
								variant="outline"
								onClick={handleSubscribe}
								disabled={createSubscriptionLoading || !pushSupported}
							>
								{createSubscriptionLoading ? (
											<LoadingState type="spinner" size="sm" variant="inline" />
								) : (
									"Subscribe"
								)}
							</Button>
						</div>
					)}
				</>
			)}

			{subscriptions && subscriptions.length > 0 && (
				<div className="border-t pt-6 mt-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<h3 className="text-lg font-semibold text-foreground">
								Notification Preferences
							</h3>
							<p className="text-sm text-muted-foreground">
								Customize which notifications you want to receive
							</p>
						</div>
						<Button
							variant="outline"
							onClick={() => setPreferencesOpen(true)}
						>
							Configure
						</Button>
					</div>
				</div>
			)}

			<Sheet open={preferencesOpen} onOpenChange={setPreferencesOpen}>
				<SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Notification Preferences</SheetTitle>
						<SheetDescription>
							Customize which notifications you want to receive
						</SheetDescription>
					</SheetHeader>
					<div className="mt-6">
						<NotificationPreferencesContent />
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
