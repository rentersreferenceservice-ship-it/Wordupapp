'use client'

import { createContext, useContext, useEffect } from 'react'

// Lets a game tell its parent (the level runner) "this level is done".
// Every game shows a <Done> message exactly when it's finished, so Done
// calls this once when it appears.
export const GameCompleteContext = createContext<(() => void) | null>(null)

export function useSignalComplete() {
  const onComplete = useContext(GameCompleteContext)
  useEffect(() => { onComplete?.() }, [onComplete])
}
