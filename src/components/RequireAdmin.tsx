import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldX, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const claimAdmin = useMutation(api.profile.claimAdmin);
  const [claiming, setClaiming] = useState(false);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimAdmin();
      toast.success("Admin access granted");
      // Role updates reactively; this component re-renders to the admin UI.
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to claim admin access",
      );
    } finally {
      setClaiming(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShieldX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted to EstateDirect administrators. If your
            account email is in the admin allowlist
            (<code className="rounded bg-muted px-1 text-[11px]">
              ESTATEDIRECT_ADMIN_EMAIL
            </code>
            ), claim access below.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              Back to dashboard
            </Button>
            <Button size="sm" onClick={handleClaim} disabled={claiming}>
              {claiming ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              )}
              {claiming ? "Checking..." : "Claim admin access"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return children;
}