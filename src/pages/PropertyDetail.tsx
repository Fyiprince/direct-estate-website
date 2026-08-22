import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyImage } from "@/components/property/property-image";
import { PropertyCard } from "@/components/property/property-card";
import { MapView } from "@/components/property/map-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import {
  formatINR,
  formatPriceCompact,
  formatArea,
  formatDate,
  relativeTime,
  initials,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  FURNISHING_LABELS,
} from "@/lib/property";

import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Phone,
  Lock,
  MessageCircle,
  Clock,
  Eye,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const createInquiry = useMutation(api.inquiries.create);
  const incrementView = useMutation(
    api.properties.incrementView,
  );

  const property = useQuery(
    api.properties.get,
    id
      ? { id: id as Id<"properties"> }
      : "skip",
  );

  const similar = useQuery(
    api.properties.similar,
    id && property
      ? {
          id: id as Id<"properties">,
          city: property.city,
          type: property.type,
          limit: 4,
        }
      : "skip",
  );

  const viewIncremented = useRef(false);

  const [photoIndex, setPhotoIndex] =
    useState(0);

  const [copied, setCopied] =
    useState(false);

  const [inquiryOpen, setInquiryOpen] =
    useState(false);

  const [inquiryName, setInquiryName] =
    useState("");

  const [inquiryEmail, setInquiryEmail] =
    useState("");

  const [inquiryPhone, setInquiryPhone] =
    useState("");

  const [inquiryMessage, setInquiryMessage] =
    useState("");

  // Increment property view once per browser visitor.
  useEffect(() => {
    if (!id || viewIncremented.current) {
      return;
    }

    let visitorId = localStorage.getItem(
      "estatedirect_visitor_id",
    );

    if (!visitorId) {
      visitorId = crypto.randomUUID();

      localStorage.setItem(
        "estatedirect_visitor_id",
        visitorId,
      );
    }

    viewIncremented.current = true;

    incrementView({
      id: id as Id<"properties">,
      visitorId,
    }).catch((error) => {
      console.error(
        "Failed to record property view:",
        error,
      );
    });
  }, [id, incrementView]);

  const handleCopyPhone = async () => {
    if (property?.owner?.phone) {
      try {
        await navigator.clipboard.writeText(
          property.owner.phone,
        );

        setCopied(true);

        setTimeout(
          () => setCopied(false),
          2000,
        );
      } catch {
        // Clipboard fallback.
      }
    }
  };

  if (property === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
          <Skeleton className="h-8 w-64 mb-6" />

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <Skeleton className="aspect-[16/9] w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              Property not found
            </h1>

            <p className="text-muted-foreground mt-2">
              This listing may have been removed or is no longer available.
            </p>

            <Button
              variant="default"
              className="mt-6"
              onClick={() =>
                navigate("/search")
              }
            >
              Browse properties
            </Button>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  /*
   * Public property responses may contain nullable
   * photo values. Filter them here so every photo
   * passed to PropertyImage is guaranteed to be a string.
   */
  const validPhotos: string[] = Array.from(
    property.photos ?? [],
  ).filter(
    (photo): photo is string =>
      typeof photo === "string" &&
      photo.length > 0,
  );

  const photos =
    validPhotos.length > 0
      ? validPhotos
      : [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=60",
        ];

  // Prevent an invalid index if the photo list changes.
  const safePhotoIndex =
    photoIndex < photos.length
      ? photoIndex
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="min-w-0 space-y-6">
            {/* Gallery */}
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <div className="aspect-[16/9]">
                <PropertyImage
                  src={photos[safePhotoIndex]}
                  alt={property.title}
                  className="h-full w-full"
                  priority
                />
              </div>

              {photos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setPhotoIndex(
                        (i) =>
                          (i -
                            1 +
                            photos.length) %
                          photos.length,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() =>
                      setPhotoIndex(
                        (i) =>
                          (i + 1) %
                          photos.length,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos
                      .slice(0, 7)
                      .map((_, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setPhotoIndex(i)
                          }
                          className={cn(
                            "h-2 rounded-full transition-all",
                            i ===
                              safePhotoIndex
                              ? "w-6 bg-white"
                              : "w-2 bg-white/50 hover:bg-white/70",
                          )}
                        />
                      ))}
                  </div>
                </>
              )}

              <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                {safePhotoIndex + 1} /{" "}
                {photos.length}
              </div>
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map(
                  (photo, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setPhotoIndex(i)
                      }
                      className={cn(
                        "h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                        i ===
                          safePhotoIndex
                          ? "border-primary opacity-100"
                          : "border-transparent opacity-60 hover:opacity-90",
                      )}
                    >
                      <PropertyImage
                        src={photo}
                        alt=""
                        className="h-full w-full"
                      />
                    </button>
                  ),
                )}
              </div>
            )}

            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  className={cn(
                    "text-xs font-semibold",
                    property.listingFor ===
                      "rent"
                      ? "bg-blue-600 text-white"
                      : "bg-amber-500 text-white",
                  )}
                >
                  {
                    PURPOSE_LABELS[
                      property.listingFor
                    ]
                  }
                </Badge>

                <Badge
                  variant="secondary"
                  className="text-xs capitalize"
                >
                  {
                    PROPERTY_TYPE_LABELS[
                      property.type
                    ]
                  }
                </Badge>

                {property.isVerified && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Owner
                  </Badge>
                )}

                {property.isFeatured && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs">
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {property.title}
              </h1>

              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />

                <span>
                  {property.locality},{" "}
                  {property.city}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {property.viewCount} views
                </span>

                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Listed{" "}
                  {relativeTime(
                    property.createdAt,
                  )}
                </span>
              </div>
            </div>

            <Separator />

            {/* Key specs */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SpecItem
                label="Price"
                value={formatPriceCompact(
                  property.price,
                )}
                sub={
                  property.listingFor ===
                  "rent"
                    ? "/ month"
                    : ""
                }
              />

              {property.bhk && (
                <SpecItem
                  label="Type"
                  value={`${property.bhk} BHK`}
                />
              )}

              <SpecItem
                label="Area"
                value={formatArea(
                  property.areaSqft,
                )}
              />

              <SpecItem
                label="Furnishing"
                value={
                  FURNISHING_LABELS[
                    property.furnishing
                  ]
                }
              />

              {property.deposit !=
                null && (
                <SpecItem
                  label="Deposit"
                  value={formatPriceCompact(
                    property.deposit,
                  )}
                />
              )}

              {property.maintenance !=
                null && (
                <SpecItem
                  label="Maintenance"
                  value={formatPriceCompact(
                    property.maintenance,
                  )}
                  sub="/ month"
                />
              )}

              {property.floor !=
                null && (
                <SpecItem
                  label="Floor"
                  value={`${property.floor}${
                    property.totalFloors
                      ? ` of ${property.totalFloors}`
                      : ""
                  }`}
                />
              )}

              <SpecItem
                label="Available from"
                value={formatDate(
                  property.availableFrom,
                )}
              />

              {property.ageOfProperty !=
                null && (
                <SpecItem
                  label="Age"
                  value={`${property.ageOfProperty} years`}
                />
              )}
            </div>

            <Separator />

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Description
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Amenities
              </h2>

              <div className="flex flex-wrap gap-2">
                {property.amenities
                  .length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Not specified
                  </p>
                ) : (
                  property.amenities.map(
                    (amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 text-blue-500" />
                        {amenity}
                      </span>
                    ),
                  )
                )}
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Location
              </h2>

              <p className="text-sm text-muted-foreground">
                {property.address}
              </p>

              {property.latitude !=
                null &&
              property.longitude !=
                null ? (
                <MapView
                  latitude={
                    property.latitude
                  }
                  longitude={
                    property.longitude
                  }
                  label={`${property.locality}, ${property.city}`}
                  className="mt-3"
                />
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  No map pin set for this property
                </p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:sticky lg:top-32 self-start">
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-5">
              {/* Price card */}
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {formatINR(
                    property.price,
                  )}
                </p>

                {property.listingFor ===
                  "rent" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    per month
                    {property.negotiable &&
                      " (negotiable)"}
                  </p>
                )}

                {property.listingFor ===
                  "sale" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {property.negotiable
                      ? "Negotiable"
                      : "Fixed price"}
                  </p>
                )}
              </div>

              <Separator />

              {/* Owner card */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Listed by
                </h3>

                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {property.owner
                        ? initials(
                            property
                              .owner
                              .name,
                          )
                        : "O"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {property.owner
                          ?.name ??
                          "Owner"}
                      </p>

                      {property.owner
                        ?.isVerified && (
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {property.owner
                        ?.isVerified
                        ? "Verified owner"
                        : "Owner"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </span>
                </div>

                {property.owner?.phone ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />

                        <span className="text-lg font-semibold tracking-widest text-foreground">
                          {
                            property
                              .owner
                              .phone
                          }
                        </span>
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={
                                handleCopyPhone
                              }
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent side="left">
                            {copied
                              ? "Copied!"
                              : "Copy number"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Visible to EstateDirect admins only.
                    </p>
                  </>
                ) : (
                  <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />

                    Owner contact details are shared only with EstateDirect
                    administrators for verification. Direct contact unlock is
                    coming in the next update.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() =>
                    setInquiryOpen(true)
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                  Send inquiry
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  disabled
                >
                  <Phone className="h-4 w-4" />
                  Unlock contact
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground">
                Inquiry &amp; contact-unlock features arrive in the next
                release.
                <br />
                Your contact info is never shared without your permission.
              </p>
            </div>
          </div>
        </div>

        {/* Similar properties */}
        {similar &&
          similar.length > 0 && (
            <section className="mt-12">
              <Separator className="mb-8" />

              <h2 className="text-xl font-bold text-foreground mb-6">
                Similar properties in{" "}
                {property.city}
              </h2>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {similar.map((p) => (
                  <PropertyCard
                    key={p._id}
                    property={p}
                  />
                ))}
              </div>
            </section>
          )}
      </main>

      {/* Inquiry Modal */}
      {inquiryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setInquiryOpen(false)
          }
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Send Inquiry
              </h2>

              <button
                type="button"
                onClick={() =>
                  setInquiryOpen(false)
                }
                className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close inquiry form"
              >
                ✕
              </button>
            </div>

            <p className="mb-5 text-sm text-muted-foreground">
              Interested in this property? Send your inquiry to EstateDirect.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={inquiryName}
                onChange={(e) =>
                  setInquiryName(
                    e.target.value,
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                type="email"
                placeholder="Your email"
                value={inquiryEmail}
                onChange={(e) =>
                  setInquiryEmail(
                    e.target.value,
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                type="tel"
                placeholder="Your phone number"
                value={inquiryPhone}
                onChange={(e) =>
                  setInquiryPhone(
                    e.target.value,
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <textarea
                placeholder="Write your message..."
                rows={4}
                value={inquiryMessage}
                onChange={(e) =>
                  setInquiryMessage(
                    e.target.value,
                  )
                }
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <Button
                type="button"
                className="w-full"
                onClick={async () => {
                  try {
                    await createInquiry({
                      propertyId:
                        property._id,
                      name: inquiryName,
                      email:
                        inquiryEmail,
                      phone:
                        inquiryPhone,
                      message:
                        inquiryMessage,
                    });

                    setInquiryName("");
                    setInquiryEmail("");
                    setInquiryPhone("");
                    setInquiryMessage("");
                    setInquiryOpen(false);

                    alert(
                      "Inquiry sent successfully!",
                    );
                  } catch (error) {
                    console.error(
                      error,
                    );

                    alert(
                      error instanceof
                        Error
                        ? error.message
                        : "Failed to send inquiry",
                    );
                  }
                }}
              >
                Send Inquiry
              </Button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </motion.div>
  );
}

function SpecItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-foreground">
        {value}

        {sub && (
          <span className="text-xs text-muted-foreground font-normal">
            {sub}
          </span>
        )}
      </p>
    </div>
  );
}