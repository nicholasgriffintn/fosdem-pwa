"use client";

import { useEffect, useState } from "react";

import useRefState from "./use-ref-state";
import { isBrowser, off, on } from "~/lib/utils";

export const useWindowSize = (initialWidth = 0, initialHeight = 0) => {
  const [state, setState] = useRefState<{ width: number; height: number }>({
    width: isBrowser ? window.innerWidth : initialWidth,
    height: isBrowser ? window.innerHeight : initialHeight,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: CBA
  useEffect((): (() => void) | undefined => {
    if (isBrowser) {
      const handler = () => {
        setState({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      on(window, "resize", handler);

      return () => {
        off(window, "resize", handler);
      };
    }
  }, []);

  return { ...state };
};
