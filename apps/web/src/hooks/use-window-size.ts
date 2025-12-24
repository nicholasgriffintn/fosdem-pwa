"use client";

import { useEffect, useState } from "react";
import { isBrowser, off, on } from "~/lib/utils";
import useRefState from "./use-ref-state";

export const useWindowSize = (initialWidth = 0, initialHeight = 0) => {
	const [state, setState] = useRefState<{ width: number; height: number }>({
		width: initialWidth,
		height: initialHeight,
	});

	useEffect((): (() => void) | undefined => {
		if (!isBrowser) {
			return;
		}

		const handler = () => {
			setState({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		handler();
		on(window, "resize", handler);

		return () => {
			off(window, "resize", handler);
		};
	}, [setState]);

	return { ...state };
};
