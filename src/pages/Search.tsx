import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/property-card";
import { SearchFilters, type FilterValues } from "@/components/search/search-filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty } from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, SORT_LABELS } from "@/lib/property";
import { Search, SlidersHorizontal, MapPin, ListEnd, ArrowUpDown } from "lucide-react";

const ITEMS_PER_PAGE = 12;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queryInput, setQueryInput] = useState(searchParams.get("q") ?? "");

  // Build filter values from URL
  const filters: FilterValues = {
    purpose: (searchParams.get("purpose") as FilterValues["purpose"]) ?? undefined,
    type: searchParams.get("type") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    bhk: searchParams.get("bhk") ? Number(searchParams.get("bhk")) : undefined,
    furnishing: searchParams.get("furnishing") ?? undefined,
    minPrice: searchParams.get("min") ? Number(searchParams.get("min")) : undefined,
    maxPrice: searchParams.get("max") ? Number(searchParams.get("max")) : undefined,
  };

  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  // Convex rejects `undefined` in args — build a clean object.
  const searchArgs: Record<string, unknown> = {
    skip: (page - 1) * ITEMS_PER_PAGE,
    limit: ITEMS_PER_PAGE,
  };
  if (sort && sort !== "newest") searchArgs.sort = sort;
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) searchArgs[key] = value;
  }

  const result = useQuery(api.properties.search, searchArgs);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    // Reset page on filter change
    if (!updates.page) next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handleFiltersChange = (changes: Partial<FilterValues>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handleReset = () => {
    setSearchParams({}, { replace: true });
    setQueryInput("");
  };

  const totalPages = result ? Math.ceil(result.total / ITEMS_PER_PAGE) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <SiteHeader />

      {/* Sticky search bar */}
      <div className="sticky top-16 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search locality, project..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateParams({ q: queryInput.trim() || undefined });
                  }
                }}
                className="h-9 pl-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => updateParams({ q: queryInput.trim() || undefined })}
            >
              Search
            </Button>

            {/* Mobile filters */}
            <div className="md:hidden">
              <SearchFilters
                values={filters}
                onChange={handleFiltersChange}
                onReset={handleReset}
                compact
              />
            </div>

            {/* Sort */}
            <Select
              value={sort}
              onValueChange={(v) => updateParams({ sort: v === "newest" ? undefined : v })}
            >
              <SelectTrigger className="h-9 w-auto gap-1 text-xs border-none shadow-none">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{SORT_LABELS[sort as keyof typeof SORT_LABELS]}</span>
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm">
                    {SORT_LABELS[opt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="sticky top-36">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Filters
                </h3>
                {(Object.values(filters).filter(Boolean).length > 0) && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <SearchFilters
                values={filters}
                onChange={handleFiltersChange}
                onReset={handleReset}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
            <div className="flex items-center justify-between mb-4">
              {result === undefined ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat("en-IN").format(result.total)}
                  </span>{" "}
                  {result.total === 1 ? "property" : "properties"} found
                </p>
              )}
            </div>

            {/* Grid */}
            {result === undefined ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : result.items.length === 0 ? (
              <Empty className="py-16">
                <EmptyMedia>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No properties found</EmptyTitle>
                  <EmptyDescription>
                    Try adjusting your filters or search in a different city.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Clear all filters
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((property) => (
                  <PropertyCard key={property._id} property={property} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        updateParams({ page: String(page - 1) })
                      }
                      className={cn(
                        page <= 1 && "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Show page numbers around current page
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else {
                      const start = Math.max(1, page - 3);
                      pageNum = start + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={page === pageNum}
                          onClick={() => updateParams({ page: String(pageNum) })}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        updateParams({ page: String(page + 1) })
                      }
                      className={cn(
                        page >= totalPages && "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </motion.div>
  );
}