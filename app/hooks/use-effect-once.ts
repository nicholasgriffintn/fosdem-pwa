"use client";

import { type EffectCallback, useEffect } from "react";

const useEffectOnce = (effect: EffectCallback) => {
	useEffect(effect, []);
};

export default useEffectOnce;
