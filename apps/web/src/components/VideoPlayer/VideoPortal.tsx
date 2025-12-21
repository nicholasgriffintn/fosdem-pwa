"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePlayer } from "~/contexts/PlayerContext";
import { SharedVideoElement } from "./SharedVideoElement";

export function VideoPortal() {
	const { videoRef, currentEvent, isLive, portalTarget } = usePlayer();
	const portalContainerRef = useRef<HTMLDivElement | null>(null);
	const [isPortalReady, setIsPortalReady] = useState(false);

	useEffect(() => {
		if (!portalContainerRef.current) {
			const container = document.createElement("div");
			container.className = "w-full h-full";
			portalContainerRef.current = container;
			setIsPortalReady(true);
		}

		return () => {
			if (portalContainerRef.current?.parentElement) {
				portalContainerRef.current.parentElement.removeChild(
					portalContainerRef.current,
				);
			}
		};
	}, []);

	useEffect(() => {
		const container = portalContainerRef.current;
		if (!container) return;

		if (!portalTarget) {
			if (container.parentElement) {
				container.parentElement.removeChild(container);
			}
			return;
		}

		const targetId =
			portalTarget === "event-page"
				? "event-page-video-portal"
				: "floating-video-portal";
		const targetElement = document.getElementById(targetId);

		if (targetElement) {
			targetElement.appendChild(container);
		}
	}, [portalTarget]);

	if (!currentEvent || !isPortalReady || !portalContainerRef.current) {
		return null;
	}

	return createPortal(
		<SharedVideoElement
			event={currentEvent}
			videoRef={videoRef}
			isLive={isLive}
			showControls={true}
		/>,
		portalContainerRef.current,
	);
}
