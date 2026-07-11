import { useEffect, useRef, type RefObject } from "react";

interface UseIntersectionObserverOptions {
  onIntersect: () => void;
  enabled?: boolean;
  rootMargin?: string;
}

// Fires `onIntersect` whenever the returned ref's element scrolls into view.
// Used as a sentinel at the bottom of a list to trigger loading the next
// page, without a "Load more" button or manual scroll math.
export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  rootMargin = "200px",
}: UseIntersectionObserverOptions): RefObject<HTMLDivElement> {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin }
    );

    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [enabled, onIntersect, rootMargin]);

  return targetRef;
}