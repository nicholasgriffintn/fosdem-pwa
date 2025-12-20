"use client";

import { type EffectCallback, useEffect, useRef } from "react";

const useEffectOnce = (effect: EffectCallback) => {
	const hasRun = useRef(false);

	useEffect(() => {
		if (!hasRun.current) {
			hasRun.current = true;
			return effect();
		}
	}, [effect]);
};

export default useEffectOnce;
