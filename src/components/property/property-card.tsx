import { PropertyImage } from "./property-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  formatPriceCompact,
  formatArea,
  relativeTime,
  PURPOSE_LABELS,
} from "@/lib/property";
import {
  Bed,
  Maximize2,
  ShieldCheck,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Public property data returned by properties.search(),
 * properties.featured(), and properties.similar().
 *
 * ownerId and phoneNumber are intentionally excluded from
 * public property responses for privacy/security.
 */
export type PropertyCardData = Omit<
  Doc<"properties">,
  "ownerId" | "phoneNumber"
> & {
  owner?: {
    name: string;
    initials: string;
    isVerified: boolean;
    phone: string | null;
  } | null;
};

interface PropertyCardProps {
  property: PropertyCardData;
  className?: string;
  priority?: boolean;
  showOwner?: boolean;
}

export function PropertyCard({
  property,
  className,
  priority,
  showOwner,
}: PropertyCardProps) {
  const navigate = useNavigate();
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos =
    property.photos.length > 0
      ? property.photos
      : [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=60",
        ];

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      setPhotoIndex(
        (i) =>
          (i - 1 + photos.length) %
          photos.length,
      );
    },
    [photos.length],
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      setPhotoIndex(
        (i) => (i + 1) % photos.length,
      );
    },
    [photos.length],
  );

  const isRent =
    property.listingFor === "rent";

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border",
        className,
      )}
      onClick={() =>
        navigate(`/property/${property._id}`)
      }
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <PropertyImage
          src={photos[photoIndex]}
          alt={property.title}
          className="h-full w-full"
          priority={priority}
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/60"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/60"
              aria-label="Next photo"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos
                .slice(0, 5)
                .map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      i === photoIndex
                        ? "bg-white w-3"
                        : "bg-white/50",
                    )}
                  />
                ))}

              {photos.length > 5 && (
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
              )}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <Badge
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide px-2",
              isRent
                ? "bg-blue-600 text-white hover:bg-blue-600"
                : "bg-amber-500 text-white hover:bg-amber-500",
            )}
          >
            {PURPOSE_LABELS[
              property.listingFor
            ]}
          </Badge>

          {property.isFeatured && (
            <Badge className="bg-amber-400 text-amber-950 text-[10px] font-semibold hover:bg-amber-400">
              <Star className="mr-0.5 h-2.5 w-2.5 fill-current" />
              Featured
            </Badge>
          )}

          {property.availableFrom == null && (
            <Badge
              variant="secondary"
              className="bg-white/90 text-foreground text-[10px] border-0"
            >
              Ready to move
            </Badge>
          )}
        </div>

        {property.isVerified && (
          <div className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-blue-600 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-foreground">
            {formatPriceCompact(
              property.price,
            )}
          </span>

          {isRent && (
            <span className="text-xs text-muted-foreground">
              /mo
            </span>
          )}

          {property.negotiable && (
            <span className="text-[10px] italic text-muted-foreground ml-auto">
              Negotiable
            </span>
          )}
        </div>

        {/* Extra costs */}
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          {property.deposit != null && (
            <span className="inline-flex items-center gap-0.5">
              <span className="font-medium">
                {formatPriceCompact(
                  property.deposit,
                )}
              </span>{" "}
              deposit
            </span>
          )}

          {property.maintenance != null &&
            property.maintenance > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <span className="font-medium">
                  {formatPriceCompact(
                    property.maintenance,
                  )}
                </span>
                /mo maintenance
              </span>
            )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium leading-snug text-foreground line-clamp-1">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />

          <span className="truncate">
            {property.locality},{" "}
            {property.city}
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          {property.bhk && (
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {property.bhk} BHK
            </span>
          )}

          <span className="flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            {formatArea(
              property.areaSqft,
            )}
          </span>

          <span className="capitalize">
            {property.furnishing.replace(
              "_",
              " ",
            )}
          </span>
        </div>

        {/* Owner & date */}
        {showOwner && property.owner && (
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                  {property.owner.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-foreground">
                  {property.owner.name}
                </span>

                {property.owner
                  .isVerified && (
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                )}
              </div>
            </div>

            <span className="text-[10px] text-muted-foreground">
              {relativeTime(
                property.createdAt,
              )}
            </span>
          </div>
        )}

        {/* Date */}
        {!showOwner && (
          <div className="text-[10px] text-muted-foreground text-right">
            {relativeTime(
              property.createdAt,
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full" />

      <div className="p-3 space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />

        <div className="flex gap-3 pt-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </Card>
  );
}