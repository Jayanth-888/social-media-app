import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names, e.g. cn("p-2", isActive && "bg-primary") */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Relative time like "3h ago", "2d ago" for post timestamps */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const intervals: [string, number][] = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];

  for (const [label, secondsInUnit] of intervals) {
    const count = Math.floor(seconds / secondsInUnit);
    if (count >= 1) return `${count}${label}`;
  }
  return "now";
}
