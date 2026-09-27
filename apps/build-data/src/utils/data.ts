export function flattenData<T>(element: unknown): T {
	if (Array.isArray(element)) {
		return element.map(flattenData) as T;
	}

	if (typeof element === "object" && element !== null) {
		const keys = Object.keys(element);

		if (keys.length === 1) {
			const key = keys[0];
			if (key === "value") {
				return (element as Record<string, T>)[key];
			}
		}

		const newElement = {} as T;
		for (const e of keys) {
			(newElement as Record<string, unknown>)[e] = flattenData(
				(element as Record<string, unknown>)[e],
			);
		}
		return newElement;
	}

	return element as T;
}
