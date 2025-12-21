"use client";

import { useLayoutEffect } from "react";

// @see https://usehooks.com/useLockBodyScroll.
export function useLockBody(shouldLock: boolean) {
	useLayoutEffect((): (() => void) => {
		if (!shouldLock) {
			return () => undefined;
		}
		const originalStyle: string = window.getComputedStyle(
			document.body,
		).overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = originalStyle;
		};
	}, [shouldLock]);
}
