import { Link } from "react-router";
import { CITIES, PROPERTY_TYPE_LABELS } from "@/lib/property";
import { Building2, ShieldCheck, Handshake, BadgeIndianRupee, ChevronRight } from "lucide-react";
import { useState } from "react";

const BROWSE = [
  { label: "Flats for rent", href: "/search?purpose=rent&type=flat" },
  { label: "Houses for rent", href: "/search?purpose=rent&type=house" },
  { label: "PG & hostels", href: "/search?purpose=rent&type=pg" },
  { label: "Villas for rent", href: "/search?purpose=rent&type=villa" },
  { label: "Commercial for rent", href: "/search?purpose=rent&type=commercial" },
  { label: "Flats for sale", href: "/search?purpose=sale&type=flat" },
  { label: "Houses for sale", href: "/search?purpose=sale&type=house" },
  { label: "Villas for sale", href: "/search?purpose=sale&type=villa" },
];

const OWNER_LINKS = [
  { label: "Post property free", href: "/post-property" },
  { label: "Owner dashboard", href: "/dashboard" },
  { label: "How it works", href: "/" },
];

export function SiteFooter() {
  const [expandedCity, setExpandedCity] = useState(false);

  return (
    <footer className="border-t border-border/50 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        {/* Top grid */}
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
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                <Handshake className="h-3 w-3" /> 0% brokerage
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                <ShieldCheck className="h-3 w-3" /> Verified owners
              </span>
            </div>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Browse</h4>
            <ul className="mt-3 space-y-2">
              {BROWSE.slice(0, 6).map((l) => (
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

          {/* For Owners */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">For Owners</h4>
            <ul className="mt-3 space-y-2">
              {OWNER_LINKS.map((l) => (
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
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Verified owner badges
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <BadgeIndianRupee className="h-3.5 w-3.5 text-blue-500" /> Direct contact, no middleman
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Handshake className="h-3.5 w-3.5 text-blue-500" /> Free listing, always
              </span>
            </div>
          </div>

          {/* Cities */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Top Cities</h4>
            <ul className="mt-3 space-y-2">
              {CITIES.slice(0, 5).map((city) => (
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
            <button
              onClick={() => setExpandedCity(!expandedCity)}
              className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expandedCity ? "Show less" : `+ ${CITIES.length - 5} more cities`}
              <ChevronRight className={expandedCity ? "h-3 w-3 rotate-90" : "h-3 w-3"} />
            </button>
            {expandedCity && (
              <ul className="mt-2 space-y-2">
                {CITIES.slice(5).map((city) => (
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
            )}
          </div>
        </div>

        {/* City + type deep links */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Popular Searches
          </h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {CITIES.slice(0, 4).flatMap((city) =>
              (["rent", "sale"] as const).flatMap((purpose) =>
                (["flat", "house", "pg"] as const).map((type) => (
                  <Link
                    key={`${city}-${purpose}-${type}`}
                    to={`/search?city=${encodeURIComponent(city)}&purpose=${purpose}&type=${type}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {PROPERTY_TYPE_LABELS[type]} for {purpose} in {city}
                  </Link>
                )),
              ),
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} EstateDirect. All rights reserved.</p>
          <p className="text-center">
            Built for a broker-free India · {CITIES.length} cities ·{" "}
            <span className="text-primary font-medium">0% brokerage</span> always
          </p>
        </div>
      </div>
    </footer>
  );
}