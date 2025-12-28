"use client";

import { type EffectCallback, useEffect, useRef } from "react";

const useEffectOnce = (effect: EffectCallback) => {
	const hasRun = useRef(false);
	const cleanupRef = useRef<void | (() => void)>(undefined);
	const effectRef = useRef(effect);
	effectRef.current = effect;

	useEffect(() => {
		if (!hasRun.current) {
			hasRun.current = true;
			cleanupRef.current = effectRef.current();
		}
		return () => {
			if (cleanupRef.current) {
				cleanupRef.current();
			}
		};
	}, []);
};

export default useEffectOnce;
