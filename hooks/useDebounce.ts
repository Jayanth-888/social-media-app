import { useEffect, useState } from "react";

// Returns `value`, but only after it hasn't changed for `delayMs` — the
// classic pattern for search-as-you-type without hammering the API on
// every keystroke.
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}