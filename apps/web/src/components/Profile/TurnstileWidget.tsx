"use client";

import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-api";
const TURNSTILE_SCRIPT_URL =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileWidgetProps {
	readonly action?: string;
	readonly siteKey: string;
}

export function TurnstileWidget({ action, siteKey }: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		const container = containerRef.current;
		const script = document.getElementById(TURNSTILE_SCRIPT_ID);
		let active = true;

		if (!container) {
			return;
		}

		const renderWidget = () => {
			if (!active || widgetIdRef.current || !window.turnstile) {
				return;
			}

			widgetIdRef.current = window.turnstile.render(container, {
				action,
				appearance: "interaction-only",
				sitekey: siteKey,
				size: "flexible",
			});
		};

		renderWidget();
		script?.addEventListener("load", renderWidget);

		return () => {
			active = false;
			script?.removeEventListener("load", renderWidget);

			if (widgetIdRef.current) {
				window.turnstile?.remove(widgetIdRef.current);
				widgetIdRef.current = undefined;
			}
		};
	}, [action, siteKey]);

	return (
		<>
			<script id={TURNSTILE_SCRIPT_ID} src={TURNSTILE_SCRIPT_URL} async defer />
			<div ref={containerRef} className="js-required" />
		</>
	);
}
