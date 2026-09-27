export const memoize = <T, R>(fn: (arg: T) => R) => {
	const cache = new Map<T, R>();
	return (arg: T): R => {
		const value = cache.get(arg) ?? fn(arg);
		cache.set(arg, value);
		return value;
	};
};
