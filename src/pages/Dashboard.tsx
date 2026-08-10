import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { cn } from "@/lib/utils";
import { formatINR, formatPriceCompact, relativeTime, initials, STATUS_LABELS } from "@/lib/property";
import {
  Building2,
  Eye,
  PlusCircle,
  Search,
  Trash2,
  LayoutDashboard,
  ChevronRight,
  Home,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const myListings = useQuery(api.properties.myListings);
  const deleteProperty = useMutation(api.properties.deleteProperty);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <Skeleton className="h-8 w-48" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/auth?returnTo=/dashboard");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteProperty({ id: id as any });
      toast.success("Listing deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const isOwner = user?.role === "owner";
  const isTenant = user?.role === "tenant";
  const isAdmin = user?.role === "admin";

  const liveListings = myListings?.filter((p) => p.status === "live") ?? [];
  const pendingListings = myListings?.filter((p) => p.status === "pending") ?? [];
  const totalViews = myListings?.reduce((s, p) => s + p.viewCount, 0) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {user?.name ? `Hi, ${user.name.split(" ")[0]}!` : "Welcome!"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium capitalize"
                >
                  {user?.role ?? "Renter"}
                </Badge>
                {user?.isVerified && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-[10px]">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate("/post-property")}
              >
                <PlusCircle className="h-4 w-4" />
                Post property
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* ── Owner dashboard ── */}
        {isOwner && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              <StatCard icon={Building2} label="Live listings" value={liveListings.length} />
              <StatCard icon={Clock} label="Pending review" value={pendingListings.length} />
              <StatCard icon={Eye} label="Total views" value={totalViews} />
              <StatCard
                icon={TrendingUp}
                label="Total listings"
                value={myListings?.length ?? 0}
              />
            </div>

            {/* My Listings */}
            <Card>
              <CardHeader>
                <CardTitle>My Listings</CardTitle>
                <CardDescription>
                  {myListings === undefined
                    ? "Loading..."
                    : myListings.length === 0
                      ? "You haven't listed any properties yet"
                      : `${myListings.length} property${myListings.length > 1 ? "ies" : "y"} listed`}
                </CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/post-property")}
                    className="gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="p-0">
                {myListings === undefined ? (
                  <div className="space-y-3 p-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : myListings.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Post your first property and start connecting with renters directly
                    </p>
                    <Button
                      variant="default"
                      className="mt-4 gap-1.5"
                      onClick={() => navigate("/post-property")}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Post a property
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {myListings.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                      >
                        {/* Thumb */}
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.photos[0] && (
                            <img
                              src={p.photos[0].startsWith("http") ? p.photos[0] : ""}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{formatPriceCompact(p.price)}</span>
                            {p.listingFor === "rent" && <span>/mo</span>}
                            <span>·</span>
                            <span>{p.locality}, {p.city}</span>
                            <span>·</span>
                            <span>
                              <Eye className="inline h-3 w-3 mr-0.5" />
                              {p.viewCount}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <Badge
                          className={cn(
                            "text-[10px] font-medium shrink-0",
                            p.status === "live" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                            p.status === "pending" && "bg-amber-100 text-amber-700 border-amber-200",
                            p.status === "rejected" && "bg-red-100 text-red-700 border-red-200",
                            p.status === "expired" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {STATUS_LABELS[p.status]}
                        </Badge>

                        {/* Actions */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => navigate(`/property/${p._id}`)}
                        >
                          View
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove "{p.title}" from the marketplace.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(p._id)}
                                disabled={deleting === p._id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleting === p._id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Tenant dashboard ── */}
        {isTenant && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Find your next home</p>
                    <p className="text-xs text-muted-foreground">
                      Browse thousands of properties listed directly by owners
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full gap-1.5"
                  onClick={() => navigate("/search")}
                >
                  <Search className="h-4 w-4" />
                  Start searching
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Own a property?</p>
                    <p className="text-xs text-muted-foreground">
                      Switch to an Owner account and list your property free
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full gap-1.5"
                  onClick={() => navigate("/post-property")}
                >
                  <PlusCircle className="h-4 w-4" />
                  Post a property
                </Button>
              </Card>
            </div>

            {/* Recent listings */}
            <DashboardRecentListings />
          </>
        )}

        {/* ── Admin / unset role fallback ── */}
        {(isAdmin || (!isOwner && !isTenant)) && (
          <div className="text-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">
              {isAdmin ? "Admin panel" : "Welcome to EstateDirect"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin
                ? "Admin dashboard coming soon"
                : "Set up your profile to start exploring or listing properties."}
            </p>
            {!isAdmin && (
              <div className="flex justify-center gap-3 mt-4">
                <Button
                  variant="default"
                  className="gap-1.5"
                  onClick={() => navigate("/search")}
                >
                  <Search className="h-4 w-4" />
                  Browse properties
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => navigate("/post-property")}
                >
                  <PlusCircle className="h-4 w-4" />
                  Post your property
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}

/** Shows a few recent live listings for the tenant dashboard. */
function DashboardRecentListings() {
  const recent = useQuery(api.properties.search, { limit: 4, skip: 0, sort: "newest" });
  const navigate = useNavigate();

  if (recent === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (recent.items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recently added</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => navigate("/search")}
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {recent.items.slice(0, 4).map((p) => (
            <button
              key={p._id}
              onClick={() => navigate(`/property/${p._id}`)}
              className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.photos[0] && (
                  <img
                    src={p.photos[0].startsWith("http") ? p.photos[0] : ""}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {p.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPriceCompact(p.price)}
                  {p.listingFor === "rent" && " /mo"} · {p.locality}, {p.city}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}