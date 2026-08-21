import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/property";
import {
  Search,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Building2,
  User,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";

interface SiteHeaderProps {
  variant?: "default" | "transparent";
  hidePostCta?: boolean;
}

const NAV_LINKS = [
  { href: "/search?purpose=rent", label: "Rent" },
  { href: "/search?purpose=sale", label: "Buy" },
  { href: "/search?purpose=rent&type=pg", label: "PG" },
  { href: "/search?purpose=rent&type=commercial", label: "Commercial" },
];

export function SiteHeader({
  variant = "default",
  hidePostCta,
}: SiteHeaderProps) {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isTransparent = variant === "transparent";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors",
        isTransparent
          ? "border-transparent bg-transparent"
          : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border/50",
      )}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
        >
          <div
            className={cn(
              "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg",
              isTransparent
                ? "bg-white text-primary shadow-sm"
                : "bg-primary text-primary-foreground",
            )}
          >
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <span
            className={cn(
              "text-base sm:text-lg font-bold tracking-tight",
              isTransparent
                ? "text-white"
                : "text-foreground",
            )}
          >
            EstateDirect
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => {
            const isActive =
              location.search === link.href.split("?")[1] ||
              (link.href.includes("purpose=rent") &&
                location.search.includes("purpose=rent"));

            return (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                className={cn(
                  "text-sm font-medium transition-colors px-3",
                  isTransparent
                    ? isActive
                      ? "text-white bg-white/15 hover:bg-white/20"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                    : isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => navigate(link.href)}
              >
                {link.label}
              </Button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search mobile */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden h-8 w-8",
              isTransparent
                ? "text-white hover:bg-white/10 hover:text-white"
                : "text-foreground",
            )}
            onClick={() => navigate("/search")}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Post Property */}
          {!hidePostCta && (
            <Button
              variant="default"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 text-xs sm:text-sm font-semibold bg-primary hover:bg-primary/90"
              onClick={() => {
                if (isAuthenticated) {
                  navigate("/post-property");
                } else {
                  navigate("/auth?returnTo=/post-property");
                }
              }}
            >
              <PlusCircle className="h-4 w-4 shrink-0" />
              <span>Post Property FREE</span>
            </Button>
          )}

          {/* Auth / Profile */}
          {isLoading ? null : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 transition-all",
                    isTransparent
                      ? "bg-white/95 hover:bg-white border border-white/70 shadow-md hover:shadow-lg"
                      : "bg-background hover:bg-muted border border-border/60 shadow-sm",
                  )}
                >
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarFallback
                      className={cn(
                        "text-[10px] sm:text-xs font-bold",
                        isTransparent
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52"
              >
                <div className="px-2 py-1.5 text-sm font-medium text-foreground truncate">
                  {user.name ?? "User"}
                </div>

                {user.role && (
                  <div className="px-2 pb-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium capitalize"
                    >
                      {user.role}
                    </Badge>
                  </div>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate("/search")}
                  className="cursor-pointer"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </DropdownMenuItem>

                {user.role === "admin" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="cursor-pointer"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin panel
                  </DropdownMenuItem>
                )}

                {user.role !== "owner" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/post-property")}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post a property
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs sm:text-sm gap-1.5",
                isTransparent &&
                  "border-white/60 bg-white/10 text-white hover:bg-white hover:text-primary",
              )}
              onClick={() => navigate("/auth")}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden h-8 w-8",
              isTransparent
                ? "text-white hover:bg-white/10 hover:text-white"
                : "text-foreground",
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background px-4 py-3 space-y-1.5">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className="w-full justify-start text-sm h-9"
              onClick={() => {
                navigate(link.href);
                setMobileOpen(false);
              }}
            >
              {link.label}
            </Button>
          ))}

          {!hidePostCta && (
            <Button
              variant="default"
              className="w-full gap-1.5 mt-2"
              onClick={() => {
                navigate(
                  isAuthenticated
                    ? "/post-property"
                    : "/auth?returnTo=/post-property",
                );
                setMobileOpen(false);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Post Property FREE
            </Button>
          )}
        </div>
      )}
    </header>
  );
}