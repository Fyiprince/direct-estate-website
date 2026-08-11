import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

const CONVEX_URL =
  (import.meta as { env?: { VITE_CONVEX_URL?: string } }).env?.VITE_CONVEX_URL ??
  "";

/**
 * Renders a property photo from either:
 * - A Convex storage ID (doesn't start with "http")
 * - An external URL (e.g. Unsplash for seed data)
 *
 * Shows a skeleton while images load and a muted placeholder on error.
 */
export function PropertyImage({ src, alt, className, priority }: PropertyImageProps) {
  const isExternal = src.startsWith("http");
  const finalUrl = isExternal
    ? src
    : `${CONVEX_URL}/api/storage/${src}`;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {!loaded && <Skeleton className="absolute inset-0 bg-muted" />}
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          No photo
        </div>
      ) : (
        <img
          src={finalUrl}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}