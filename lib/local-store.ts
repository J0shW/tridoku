// A value read from localStorage, shared through React's useSyncExternalStore (TRI-080).
// The server render and the first client render use `serverValue`; React then switches
// to the stored value without a hydration mismatch and without setting state in an effect.

export interface LocalStore<T> {
  get: () => T
  getServer: () => T
  set: (value: T) => void
  /** Reads localStorage again, e.g. after another part of the app wrote to it. */
  refresh: () => void
  subscribe: (listener: () => void) => () => void
}

export function createLocalStore<T>(read: () => T, serverValue: T): LocalStore<T> {
  let value: { current: T } | null = null
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())
  return {
    get: () => (value ??= { current: read() }).current,
    getServer: () => serverValue,
    set: (next) => {
      value = { current: next }
      notify()
    },
    refresh: () => {
      value = { current: read() }
      notify()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const noSubscribe = () => () => {}
/** For useSyncExternalStore: false during the server render and hydration, true after. */
export const hydrated = {
  subscribe: noSubscribe,
  get: () => true,
  getServer: () => false,
}
