"use client";

import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useRef,
	useState,
} from "react";

import useUnmount from "./use-unmount";

const useRefState = <S>(
	initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>] => {
	const frame = useRef(0);
	const [state, setState] = useState(initialState);

	const setRafState = useCallback((value: S | ((prevState: S) => S)) => {
		cancelAnimationFrame(frame.current);

		frame.current = requestAnimationFrame(() => {
			setState(value);
		});
	}, []);

	useUnmount(() => {
		cancelAnimationFrame(frame.current);
	});

	return [state, setRafState];
};

export default useRefState;
