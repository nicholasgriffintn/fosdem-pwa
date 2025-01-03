import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const noop = () => { };

export function on<T extends Window | Document | HTMLElement | EventTarget>(
	obj: T | null,
	...args: Parameters<T["addEventListener"]> | [string, (() => void) | null, ...any]
): void {
	if (obj?.addEventListener) {
		obj.addEventListener(
			...(args as Parameters<HTMLElement["addEventListener"]>),
		);
	}
}

export function off<T extends Window | Document | HTMLElement | EventTarget>(
	obj: T | null,
	...args:
		| Parameters<T["removeEventListener"]>
		| [string, (() => void) | null, ...any]
): void {
	if (obj?.removeEventListener) {
		obj.removeEventListener(
			...(args as Parameters<HTMLElement["removeEventListener"]>),
		);
	}
}

export const isBrowser = typeof window !== "undefined";

export const isNavigator = typeof navigator !== "undefined";
