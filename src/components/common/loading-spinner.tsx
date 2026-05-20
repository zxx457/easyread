import { LoaderCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
  label?: string;
};

export function LoadingSpinner({ className, label = "Loading" }: LoadingSpinnerProps) {
  return (
    <div role="status" aria-live="polite" className={cn("inline-flex items-center justify-center", className)}>
      <LoaderCircleIcon
        className="animate-spin-circle size-full motion-reduce:animate-none motion-reduce:opacity-70"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
