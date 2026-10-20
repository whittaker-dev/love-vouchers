import { createContext, useContext } from "react";

/**
 * True once the opening IntroLoader has lifted. Entrance animations on public pages wait for
 * it, otherwise they would play hidden behind the loader and the page would appear static.
 */
export const IntroContext = createContext(true);

export function useIntroDone(): boolean {
  return useContext(IntroContext);
}
