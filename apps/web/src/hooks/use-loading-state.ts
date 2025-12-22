import { useEffect, useState } from "react";

export function useLoadingState(isLoading: boolean, delay = 200) {
	const [showLoading, setShowLoading] = useState(false);

	useEffect(() => {
		if (isLoading) {
			const timer = setTimeout(() => setShowLoading(true), delay);
			return () => clearTimeout(timer);
		}
		setShowLoading(false);
	}, [isLoading, delay]);

	return showLoading;
}
