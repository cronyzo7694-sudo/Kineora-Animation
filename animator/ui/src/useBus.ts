import { useEffect, useRef } from 'react'
import { bus, type BusEventName, type BusEvents } from './bus'

/**
 * Subscribe a component to a bus event. The handler is kept in a ref so the
 * subscription is attached once per (name) and always sees the latest closure.
 */
export function useBus<K extends BusEventName>(name: K, handler: (payload: BusEvents[K]) => void): void {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    return bus.on(name, (p) => ref.current(p))
  }, [name])
}
