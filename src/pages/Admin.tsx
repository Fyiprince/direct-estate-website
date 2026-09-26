import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyImage } from "@/components/property/property-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import {
  formatINR,
  formatPriceCompact,
  relativeTime,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  FURNISHING_LABELS,
  STATUS_LABELS,
} from "@/lib/property";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Building2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Loader2,
  Bell,
  Trash2,
} from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type AdminProperty = Doc<"properties"> & {
  owner: {
    name: string | null;
    email: string | null;
    phone: string | null;
    isVerified: boolean;
  } | null;
};

type StatusTab = "pending" | "live" | "rejected" | "all";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  live: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-muted text-muted-foreground",
};

export default function Admin() {
  const navigate = useNavigate();

  const listings = useQuery(api.admin.allListings);
  const adminStats = useQuery(api.admin.stats);

  const approveListing = useMutation(api.admin.approveListing);
  const rejectListing = useMutation(api.admin.rejectListing);
  const deleteListing = useMutation(api.admin.deleteListing);

  // Customer inquiries - admin only
  const inquiries = useQuery(api.inquiries.listForAdmin, {});
  const updateInquiryStatus = useMutation(api.inquiries.updateStatus);

  // Property requirements - admin only
  const requirements = useQuery(api.propertyRequirements.allRequirements);
  const updateRequirementStatus = useMutation(
    api.propertyRequirements.updateStatus,
  );
 

  const [tab, setTab] = useState<StatusTab>("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActing(id);

    try {
      await approveListing({
        id: id as Id<"properties">,
      });

      toast.success("Listing approved and is now live");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Approval failed",
      );
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: string) => {
    setActing(id);

    try {
      await rejectListing({
        id: id as Id<"properties">,
      });

      toast.success("Listing rejected");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Rejection failed",
      );
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActing(id);

    try {
      await deleteListing({
        id: id as Id<"properties">,
      });

      toast.success("Listing deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete listing",
      );
    } finally {
      setActing(null);
    }
  };

  const handleInquiryStatus = async (
    id: Id<"inquiries">,
    status: "contacted" | "closed",
  ) => {
    try {
      await updateInquiryStatus({
        id,
        status,
      });

      toast.success(
        status === "contacted"
          ? "Inquiry marked as contacted"
          : "Inquiry closed",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update inquiry",
      );
    }
  };

  const handleRequirementStatus = async (
    id: Id<"propertyRequirements">,
    status: "contacted" | "closed",
  ) => {
    try {
      await updateRequirementStatus({
        id,
        status,
      });

      toast.success(
        status === "contacted"
          ? "Requirement marked as contacted"
          : "Requirement closed",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update requirement",
      );
    }
  };

  const filtered =
    listings === undefined
      ? undefined
      : listings === null
        ? null
        : tab === "all"
          ? listings
          : listings.filter((p) => p.status === tab);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">

        {/* Header */}
       <div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="icon"
    className="relative"
    onClick={() => {
      document
        .getElementById("property-requirements")
        ?.scrollIntoView({ behavior: "smooth" });
    }}
    aria-label="Customer inquiries"
  >
    <Bell className="h-4 w-4" />

    {((inquiries?.filter(
      (inquiry) => inquiry.status === "new",
    ).length ?? 0) +
      (requirements?.filter(
        (requirement) => requirement.status === "new",
      ).length ?? 0)) > 0 && (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
        {(inquiries?.filter(
          (inquiry) => inquiry.status === "new",
        ).length ?? 0) +
          (requirements?.filter(
            (requirement) => requirement.status === "new",
          ).length ?? 0)}
      </span>
    )}
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => navigate("/dashboard")}
  >
    My dashboard
  </Button>
</div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          {[
            {
              label: "Pending approval",
              value: adminStats?.pending,
              icon: Clock,
              accent: "text-amber-600 bg-amber-50",
            },
            {
              label: "Live listings",
              value: adminStats?.live,
              icon: CheckCircle2,
              accent: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Rejected",
              value: adminStats?.rejected,
              icon: XCircle,
              accent: "text-red-600 bg-red-50",
            },
            {
              label: "Total listings",
              value: adminStats?.total,
              icon: Building2,
              accent: "text-blue-600 bg-blue-50",
            },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    s.accent,
                  )}
                >
                  <s.icon className="h-4.5 w-4.5" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {s.label}
                  </p>

                  <p className="text-lg font-bold text-foreground">
                    {s.value === undefined ? "—" : s.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Listings Queue */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as StatusTab)}
            >
              <TabsList>
                <TabsTrigger value="pending" className="relative">
                  Pending

                  {adminStats && adminStats.pending > 0 && (
                    <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                      {adminStats.pending}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="live">
                  Live
                </TabsTrigger>

                <TabsTrigger value="rejected">
                  Rejected
                </TabsTrigger>

                <TabsTrigger value="all">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            {filtered === undefined ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filtered === null ? (
              <p className="p-6 text-sm text-muted-foreground">
                Access denied.
              </p>
            ) : filtered.length === 0 ? (
              <Empty className="py-14">
                <EmptyMedia>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    {tab === "pending" ? (
                      <Clock className="h-7 w-7 text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                </EmptyMedia>

                <EmptyHeader>
                  <EmptyTitle>
                    No {tab === "all" ? "" : tab} listings
                  </EmptyTitle>

                  <EmptyDescription>
                    {tab === "pending"
                      ? "Great — the approval queue is empty."
                      : "Nothing here yet."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map((p) => (
                  <AdminListingRow
                    key={p._id}
                    property={p}
                    expanded={expanded === p._id}
                    onToggle={() =>
                      setExpanded(
                        expanded === p._id ? null : p._id,
                      )
                    }
                    acting={acting === p._id}
                    onApprove={() => handleApprove(p._id)}
                    onReject={() => handleReject(p._id)}
                    onDelete={() => handleDelete(p._id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Inquiries */}
        <Card id="customer-inquiries" className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Customer Inquiries
                </h2>

                <p className="text-sm text-muted-foreground">
                  Inquiries sent by customers for live properties
                </p>
              </div>

             {inquiries && (
  <div className="flex items-center gap-2">
    {inquiries.filter((inquiry) => inquiry.status === "new").length > 0 && (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        {inquiries.filter((inquiry) => inquiry.status === "new").length} new
      </Badge>
    )}

    <Badge variant="outline">
      {inquiries.length} total
    </Badge>
  </div>
)}
            </div>
          </CardHeader>

          <CardContent>
            {inquiries === undefined ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : inquiries === null ? (
              <div className="py-10 text-center">
                <p className="font-medium text-foreground">
                  Access denied.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Admin access is required to view customer inquiries.
                </p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-medium text-foreground">
                  No inquiries yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Customer inquiries will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry._id}
                    className="rounded-xl border border-border/60 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {inquiry.name}
                          </h3>

                          <Badge
                            variant="outline"
                            className={cn(
                              inquiry.status === "new" &&
                                "border-blue-200 bg-blue-50 text-blue-700",

                              inquiry.status === "contacted" &&
                                "border-amber-200 bg-amber-50 text-amber-700",

                              inquiry.status === "closed" &&
                                "border-emerald-200 bg-emerald-50 text-emerald-700",
                            )}
                          >
                            {inquiry.status}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {inquiry.property?.title ??
                            "Property unavailable"}
                        </p>

                        <div className="mt-3 space-y-1 text-sm">

                          <p>
                            <span className="font-medium">
                              Email:
                            </span>{" "}
                            {inquiry.email}
                          </p>

                          <p>
                            <span className="font-medium">
                              Phone:
                            </span>{" "}
                            {inquiry.phone}
                          </p>

                          <p>
                            <span className="font-medium">
                              Message:
                            </span>{" "}
                            {inquiry.message}
                          </p>

                          <p className="text-xs text-muted-foreground pt-1">
                            {inquiry.property?.locality},{" "}
                            {inquiry.property?.city}
                          </p>
                        </div>
                      </div>

                      {/* Inquiry Actions */}
                      <div className="flex shrink-0 gap-2">

                        {inquiry.status === "new" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleInquiryStatus(
                                inquiry._id,
                                "contacted",
                              )
                            }
                          >
                            Mark contacted
                          </Button>
                        )}

                        {inquiry.status === "contacted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleInquiryStatus(
                                inquiry._id,
                                "closed",
                              )
                            }
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Requirements */}
        <Card id="property-requirements" className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Property Requirements
                </h2>

                <p className="text-sm text-muted-foreground">
                  Requirements submitted by customers from their dashboard
                </p>
              </div>

              {requirements && (
                <div className="flex items-center gap-2">
                  {requirements.filter(
                    (requirement) => requirement.status === "new",
                  ).length > 0 && (
                    <Badge className="border-red-200 bg-red-100 text-red-700">
                      {
                        requirements.filter(
                          (requirement) => requirement.status === "new",
                        ).length
                      }{" "}
                      new
                    </Badge>
                  )}

                  <Badge variant="outline">
                    {requirements.length} total
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {requirements === undefined ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : requirements.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-medium text-foreground">
                  No property requirements yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Customer requirements will appear here when submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requirements.map((requirement) => (
                  <div
                    key={requirement._id}
                    className="rounded-xl border border-border/60 p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {requirement.customer?.name ??
                                "Unknown Customer"}
                            </h3>

                            <Badge
                              variant="outline"
                              className={cn(
                                requirement.status === "new" &&
                                  "border-blue-200 bg-blue-50 text-blue-700",
                                requirement.status === "contacted" &&
                                  "border-amber-200 bg-amber-50 text-amber-700",
                                requirement.status === "closed" &&
                                  "border-emerald-200 bg-emerald-50 text-emerald-700",
                              )}
                            >
                              {requirement.status}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Submitted{" "}
                            {new Date(
                              requirement.createdAt,
                            ).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          {requirement.status === "new" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleRequirementStatus(
                                  requirement._id,
                                  "contacted",
                                )
                              }
                            >
                              Mark contacted
                            </Button>
                          )}

                          {requirement.status === "contacted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleRequirementStatus(
                                  requirement._id,
                                  "closed",
                                )
                              }
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Requirement
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground capitalize">
                            {requirement.listingFor}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Property Type
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground capitalize">
                            {requirement.propertyType}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Location
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {requirement.location}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Budget
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatINR(requirement.budget)}
                            {requirement.listingFor === "rent" &&
                              " / month"}
                          </p>
                        </div>

                        {requirement.bhk != null && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              BHK
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {requirement.bhk} BHK
                            </p>
                          </div>
                        )}

                        {requirement.areaSqFt != null && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              Required Area
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {requirement.areaSqFt.toLocaleString("en-IN")} sq ft
                            </p>
                          </div>
                        )}

                        {requirement.furnishing && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              Furnishing
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground capitalize">
                              {requirement.furnishing.replace(
                                "_",
                                " ",
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />

                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              Phone
                            </p>

                            <p className="text-sm font-medium text-foreground">
                              {requirement.phone ||
                                requirement.customer?.phone ||
                                "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />

                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              Email
                            </p>

                            <p className="text-sm font-medium text-foreground">
                              {requirement.customer?.email ?? "—"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Customer ID
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {requirement.customerId}
                          </p>
                        </div>
                      </div>

                      {requirement.message && (
                        <>
                          <Separator />

                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              Message
                            </p>

                            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
                              {requirement.message}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      <SiteFooter />
    </motion.div>
  );
}

function AdminListingRow({
  property: p,
  expanded,
  onToggle,
  acting,
  onApprove,
  onReject,
  onDelete,
}: {
  property: AdminProperty;
  expanded: boolean;
  onToggle: () => void;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const isPending = p.status === "pending";

  return (
    <div className="px-6 py-4">

      {/* Summary row */}
      <div className="flex items-center gap-4">

        {/* Thumb */}
        <button
          onClick={onToggle}
          className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
        >
          {p.photos[0] && (
            <PropertyImage
              src={p.photos[0]}
              alt=""
              className="h-full w-full"
            />
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {p.title}
            </p>

            <Badge
              className={cn(
                "text-[10px] border shrink-0",
                STATUS_STYLES[p.status],
              )}
            >
              {STATUS_LABELS[p.status]}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">
              {formatPriceCompact(p.price)}
            </span>

            {p.listingFor === "rent" && " /mo"} ·{" "}
            {PURPOSE_LABELS[p.listingFor]} ·{" "}
            {PROPERTY_TYPE_LABELS[p.type]} ·{" "}
            {p.locality}, {p.city}
          </p>

          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />

            submitted {relativeTime(p.createdAt)} · owner:{" "}

            <span className="font-medium text-foreground">
              {p.owner?.name ?? "—"}
            </span>

            {p.owner?.phone && (
              <span className="tabular-nums">
                ({p.owner.phone})
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">

          {isPending ? (
            <>
              <Button
                size="sm"
                className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={onApprove}
                disabled={acting}
              >
                {acting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}

                Approve
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs text-destructive hover:text-destructive"
                    disabled={acting}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Reject this listing?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                      "{p.title}" will be marked as rejected and hidden
                      from the owner's public visibility. The owner can
                      see the status in their dashboard. This can't be
                      undone from here.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                      onClick={onReject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Reject listing
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={onToggle}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Details
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-destructive hover:text-destructive"
                disabled={acting}
                aria-label="Delete listing"
              >
                {acting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete this listing?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  "{p.title}" will be permanently deleted. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete listing
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={onToggle}
            aria-label="Toggle details"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">

            {/* Photo strip */}
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-2">
              {p.photos.slice(0, 6).map((photo, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] overflow-hidden rounded-md bg-muted"
                >
                  <PropertyImage
                    src={photo}
                    alt=""
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="min-w-0 space-y-3 text-sm">

              <div className="flex flex-wrap gap-4">
                <Spec
                  label="Price"
                  value={formatINR(p.price)}
                />

                {p.bhk != null && (
                  <Spec
                    label="BHK"
                    value={`${p.bhk}`}
                  />
                )}

                <Spec
                  label="Area"
                  value={`${p.areaSqft} sq.ft`}
                />

                <Spec
                  label="Furnishing"
                  value={FURNISHING_LABELS[p.furnishing]}
                />

                {p.deposit != null && (
                  <Spec
                    label="Deposit"
                    value={formatINR(p.deposit)}
                  />
                )}

                {p.maintenance != null && (
                  <Spec
                    label="Maintenance"
                    value={`${formatINR(p.maintenance)}/mo`}
                  />
                )}
              </div>

              {p.description && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {p.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {p.amenities.map((a) => (
                  <Badge
                    key={a}
                    variant="outline"
                    className="text-[10px]"
                  >
                    {a}
                  </Badge>
                ))}
              </div>

              <Separator />

              {/* Owner contact */}
              <div className="grid gap-2 sm:grid-cols-2">

                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheck
                    className={cn(
                      "h-3.5 w-3.5",
                      p.isVerified
                        ? "text-blue-500"
                        : "text-muted-foreground",
                    )}
                  />

                  <span className="text-muted-foreground">
                    Owner:
                  </span>

                  <span className="font-medium text-foreground">
                    {p.owner?.name ?? "—"}
                  </span>

                  {p.isVerified && (
                    <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200">
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />

                  <span className="font-medium tabular-nums text-foreground">
                    {p.owner?.phone ?? "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs sm:col-span-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />

                  <span className="text-foreground">
                    {p.owner?.email ?? "—"}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-xs sm:col-span-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />

                  <span className="text-foreground">
                    {p.address}
                  </span>

                  {p.latitude != null &&
                    p.longitude != null && (
                      <span className="tabular-nums text-muted-foreground">
                        ({p.latitude.toFixed(4)},{" "}
                        {p.longitude.toFixed(4)})
                      </span>
                    )}
                </div>
              </div>

              {/* Moderation actions */}
              {isPending && (
                <div className="flex gap-2 pt-1">

                  <Button
                    size="sm"
                    className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={onApprove}
                    disabled={acting}
                  >
                    {acting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}

                    Approve & go live
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs text-destructive hover:text-destructive"
                        disabled={acting}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Reject this listing?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          This will hide "{p.title}" from the public
                          marketplace.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                          onClick={onReject}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reject listing
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>

      <p className="text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}