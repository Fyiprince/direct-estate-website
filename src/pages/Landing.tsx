import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/property-card";
import { CITIES, PROPERTY_TYPE_LABELS, formatPriceCompact } from "@/lib/property";
import { cn } from "@/lib/utils";
import {
  Building2,
  Search,
  ShieldCheck,
  Handshake,
  Phone,
  ChevronRight,
  Star,
  Home,
  Apartment,
  Store,
  Trees,
  Landmark,
  Users,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const heroImages = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=70",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=70",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=70",
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flat: <Building2 className="h-8 w-8" />,
  house: <Home className="h-8 w-8" />,
  pg: <Users className="h-8 w-8" />,
  villa: <Trees className="h-8 w-8" />,
  commercial: <Store className="h-8 w-8" />,
};

const STEPS = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "Search",
    desc: "Browse thousands of properties listed directly by owners. Filter by city, budget, BHK, and more.",
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Connect Directly",
    desc: "Contact the owner instantly — no agents, no middlemen, no brokerage fees.",
  },
  {
    icon: <Handshake className="h-6 w-6" />,
    title: "Move In",
    desc: "Finalise the deal directly with the owner and move into your new home. Zero brokerage, always.",
  },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified owner badges", desc: "Identity-verified property owners" },
  { icon: Handshake, label: "Zero brokerage", desc: "Direct owner-to-renter connection" },
  { icon: Phone, label: "Direct contact", desc: "No middleman, no hidden charges" },
  { icon: CheckCircle2, label: "Admin-moderated", desc: "Every listing reviewed before going live" },
];

export default function Landing() {
  const navigate = useNavigate();
  const stats = useQuery(api.properties.stats);
  const featured = useQuery(api.properties.featured, { limit: 8 });
  const [purpose, setPurpose] = useState<string>("rent");
  const [city, setCity] = useState<string>("");
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (purpose) params.set("purpose", purpose);
    if (city) params.set("city", city);
    if (query.trim()) params.set("q", query.trim());
    navigate(`/search?${params.toString()}`);
  };

  const cityCounts = new Map(
    stats?.byCity.map((c) => [c.city, c.count]) ?? [],
  );

  const typeCounts = new Map(
    stats?.byType.map((t) => [t.type, t.count]) ?? [],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <SiteHeader variant="transparent" />

      {/* ── Hero ── */}
      <section className="relative -mt-16 flex min-h-[85vh] items-center justify-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImages[0]}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-950/70 to-emerald-950/85" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-200 border-emerald-400/30 px-3 py-1 text-xs font-medium">
              <Handshake className="mr-1.5 h-3.5 w-3.5" />
              Zero brokerage marketplace
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Rent & buy directly from{" "}
              <span className="text-emerald-300">owners</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100/80">
              No brokers. No commissions. Just thousands of verified owners
              listing their properties directly — connect with a tap.
            </p>
          </motion.div>

          {/* Search card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mx-auto mt-8 w-full max-w-2xl rounded-xl bg-white/95 backdrop-blur-sm p-4 shadow-xl"
          >
            <Tabs value={purpose} onValueChange={setPurpose} className="w-full">
              <TabsList className="w-full bg-muted/50">
                <TabsTrigger value="rent" className="flex-1 text-xs sm:text-sm">For Rent</TabsTrigger>
                <TabsTrigger value="sale" className="flex-1 text-xs sm:text-sm">For Sale</TabsTrigger>
                <TabsTrigger value="pg" className="flex-1 text-xs sm:text-sm">PG</TabsTrigger>
                <TabsTrigger value="commercial" className="flex-1 text-xs sm:text-sm">Commercial</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary sm:w-40"
              >
                <option value="">All cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by locality, project name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 pl-9"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                className="h-10 gap-1.5 px-6"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>

            {/* Quick links */}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {["HSR Layout", "Koramangala", "Whitefield", "Andheri West", "Powai", "Dwarka"].map(
                (loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setQuery(loc);
                      handleSearch();
                    }}
                    className="rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    {loc}
                  </button>
                ),
              )}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-emerald-200/60"
        >
          <ChevronRight className="h-6 w-6 rotate-90" />
        </motion.div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-border/50 bg-emerald-950 text-emerald-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: stats?.total ?? "—", label: "Properties listed", icon: Building2 },
              { value: stats?.verifiedProperties ?? "—", label: "Verified owners", icon: ShieldCheck },
              { value: "0%", label: "Brokerage charged", icon: Handshake },
              { value: CITIES.length, label: "Cities covered", icon: MapPin },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                <item.icon className="h-5 w-5 text-emerald-400" />
                <span className="text-2xl font-bold text-white">
                  {typeof item.value === "number"
                    ? new Intl.NumberFormat("en-IN").format(item.value)
                    : item.value}
                </span>
                <span className="text-xs text-emerald-200/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Featured properties</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Owner-verified listings handpicked for you
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex gap-1"
              onClick={() => navigate("/search")}
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {featured === undefined ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {featured.map((property) => (
                  <CarouselItem key={property._id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4">
                    <PropertyCard property={property} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-4 flex justify-center gap-2">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </Carousel>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => navigate("/search")}
            >
              View all properties
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Browse by city ── */}
      <section className="bg-secondary/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Browse by city</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Find properties in India's top cities
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CITIES.slice(0, 7).map((city) => (
              <button
                key={city}
                onClick={() => navigate(`/search?city=${encodeURIComponent(city)}`)}
                className="group relative flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{city}</p>
                  <p className="text-xs text-muted-foreground">
                    {cityCounts.get(city) ?? 0} properties
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Property types ── */}
      <section className="bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Property types</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything from compact PGs to luxury villas
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(["flat", "house", "pg", "villa", "commercial"] as const).map((type) => (
              <button
                key={type}
                onClick={() => navigate(`/search?type=${type}`)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="text-primary group-hover:scale-110 transition-transform">
                  {TYPE_ICONS[type]}
                </div>
                <p className="text-sm font-semibold text-foreground">{PROPERTY_TYPE_LABELS[type]}</p>
                <p className="text-xs text-muted-foreground">
                  {typeCounts.get(type) ?? 0} listed
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-secondary/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Three simple steps to your new home — zero brokerage
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center rounded-xl border border-border/50 bg-card p-8 text-center shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <div className="absolute -top-2 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust section ── */}
      <section className="bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Why EstateDirect?
          </h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Built for a broker-free India, with trust at every step
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_POINTS.map((point) => (
              <div
                key={point.label}
                className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <point.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{point.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-600 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Own a property? List it free
          </h2>
          <p className="mt-2 text-emerald-100/80">
            Join thousands of owners who list directly and save on brokerage.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2"
              onClick={() => navigate("/auth?returnTo=/post-property")}
            >
              <Building2 className="h-5 w-5" />
              Post your property
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-emerald-400/50 text-white hover:bg-emerald-600/50 gap-2"
              onClick={() => navigate("/search")}
            >
              <Search className="h-5 w-5" />
              Start searching
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </motion.div>
  );
}