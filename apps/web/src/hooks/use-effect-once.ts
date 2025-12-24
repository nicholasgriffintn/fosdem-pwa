"use client";

import { type EffectCallback, useEffect, useRef } from "react";

const useEffectOnce = (effect: EffectCallback) => {
	const hasRun = useRef(false);
	const effectRef = useRef(effect);
	effectRef.current = effect;

	useEffect(() => {
		if (!hasRun.current) {
			hasRun.current = true;
			const cleanup = effectRef.current();
			return cleanup;
		}
	}, []);
};

export default useEffectOnce;
