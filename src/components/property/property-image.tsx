import { useStorageUrl } from "convex/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Renders a property photo from either:
 * - A Convex storage ID (starts with no "http" prefix)
 * - An external URL (e.g. Unsplash for seed data)
 *
 * Shows a skeleton while external images load / storage URLs resolve,
 * and a muted placeholder on error.
 */
export function PropertyImage({ src, alt, className, priority }: PropertyImageProps) {
  const isExternal = src.startsWith("http");
  const storageUrl = useStorageUrl(isExternal ? undefined : src);
  const finalUrl = isExternal ? src : (storageUrl ?? null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!finalUrl && !isExternal) {
    // Still resolving the storage URL
    return <Skeleton className={cn("bg-muted", className)} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {!loaded && <Skeleton className="absolute inset-0 bg-muted" />}
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          No photo
        </div>
      ) : (
        <img
          src={finalUrl!}
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