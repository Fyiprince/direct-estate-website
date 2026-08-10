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
  Home,
  Search,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";

interface SiteHeaderProps {
  variant?: "default" | "transparent";
}

const NAV_LINKS = [
  { href: "/search?purpose=rent", label: "Rent" },
  { href: "/search?purpose=sale", label: "Buy" },
  { href: "/search?purpose=rent&type=pg", label: "PG" },
  { href: "/search?purpose=rent&type=commercial", label: "Commercial" },
];

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href || location.search === href.split("?")[1];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors",
        variant === "transparent"
          ? "border-transparent bg-transparent"
          : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border/50",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">
            EstateDirect
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className={cn(
                "text-sm font-medium transition-colors",
                location.search === link.href.split("?")[1]
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => navigate(link.href)}
            >
              {link.label}
            </Button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Post Property */}
          <Button
            variant="default"
            size="sm"
            className="hidden sm:inline-flex gap-1.5"
            onClick={() => {
              if (isAuthenticated) navigate("/post-property");
              else navigate("/auth?returnTo=/post-property");
            }}
          >
            <PlusCircle className="h-4 w-4" />
            Post Property
          </Button>

          {isLoading ? null : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
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
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background px-4 py-3 space-y-2">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                navigate(link.href);
                setMobileOpen(false);
              }}
            >
              {link.label}
            </Button>
          ))}
          <Button
            variant="default"
            className="w-full gap-1.5"
            onClick={() => {
              navigate(isAuthenticated ? "/post-property" : "/auth?returnTo=/post-property");
              setMobileOpen(false);
            }}
          >
            <PlusCircle className="h-4 w-4" />
            Post Property
          </Button>
        </div>
      )}
    </header>
  );
}