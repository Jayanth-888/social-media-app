import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-primary-dark",
        variant === "secondary" && "border border-border bg-transparent hover:bg-gray-50",
        variant === "ghost" && "bg-transparent hover:bg-gray-100",
        className
      )}
      {...props}
    />
  );
}
