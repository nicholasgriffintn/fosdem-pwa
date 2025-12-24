"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
	return () => { };
}

function getSnapshot() {
	return true;
}

function getServerSnapshot() {
	return false;
}

export function useIsClient() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
