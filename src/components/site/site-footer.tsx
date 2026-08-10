import { Link } from "react-router";
import { CITIES } from "@/lib/property";
import { Building2, ShieldCheck, Handshake, BadgeIndianRupee } from "lucide-react";

const BROWSE = [
  { label: "Flats for rent", href: "/search?purpose=rent&type=flat" },
  { label: "Houses for rent", href: "/search?purpose=rent&type=house" },
  { label: "PG & hostels", href: "/search?purpose=rent&type=pg" },
  { label: "Villas for rent", href: "/search?purpose=rent&type=villa" },
  { label: "Commercial space", href: "/search?purpose=rent&type=commercial" },
  { label: "Buy a home", href: "/search?purpose=sale" },
];

const OWNERS = [
  { label: "Post a property", href: "/post-property" },
  { label: "Owner dashboard", href: "/dashboard" },
  { label: "Pricing for owners", href: "/search" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-foreground">EstateDirect</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              India's broker-free property marketplace. Owners list directly,
              renters connect directly — zero brokerage, always.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <Handshake className="h-3 w-3" /> 0% brokerage
              </span>
            </div>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Browse</h4>
            <ul className="mt-3 space-y-2">
              {BROWSE.map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Owners */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">For Owners</h4>
            <ul className="mt-3 space-y-2">
              {OWNERS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified owner badges
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <BadgeIndianRupee className="h-3.5 w-3.5 text-emerald-500" /> Direct contact, no middleman
              </span>
            </div>
          </div>

          {/* Cities */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Top Cities</h4>
            <ul className="mt-3 space-y-2">
              {CITIES.slice(0, 6).map((city) => (
                <li key={city}>
                  <Link
                    to={`/search?city=${encodeURIComponent(city)}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} EstateDirect. All rights reserved.</p>
          <p className="text-center">
            Built for a broker-free India — {CITIES.length} cities and counting.
          </p>
        </div>
      </div>
    </footer>
  );
}