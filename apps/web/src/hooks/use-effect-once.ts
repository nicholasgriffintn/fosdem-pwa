"use client";

import { type EffectCallback, useEffect, useRef } from "react";

const useEffectOnce = (effect: EffectCallback) => {
	const hasRun = useRef(false);
	const cleanupRef = useRef<(() => void) | undefined>(undefined);

	useEffect(() => {
		if (!hasRun.current) {
			hasRun.current = true;
			const cleanup = effect();
			if (cleanup) {
				cleanupRef.current = cleanup;
			}
		}

		return () => {
			if (cleanupRef.current) {
				cleanupRef.current();
				cleanupRef.current = undefined;
			}
		};
	}, []);
};

export default useEffectOnce;
