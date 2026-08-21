import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function PropertyImage({
  src,
  alt,
  className,
  priority,
}: PropertyImageProps) {
  const isExternal = src.startsWith("http");

  const storageUrl = useQuery(
    api.storage.getUrl,
    isExternal
      ? "skip"
      : {
          storageId: src as Id<"_storage">,
        },
  );

  const finalUrl = isExternal ? src : storageUrl ?? "";

  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        className,
      )}
    >
      {!loaded && !errored && (
        <Skeleton className="absolute inset-0 bg-muted" />
      )}

      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          No photo
        </div>
      ) : finalUrl ? (
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
      ) : null}
    </div>
  );
}