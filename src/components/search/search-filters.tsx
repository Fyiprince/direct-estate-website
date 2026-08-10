import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  CITIES,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  FURNISHING,
  FURNISHING_LABELS,
  BHK_OPTIONS,
  AMENITIES,
} from "@/lib/property";
import { SlidersHorizontal, RotateCcw, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export type FilterValues = {
  purpose?: "rent" | "sale";
  type?: string;
  city?: string;
  q?: string;
  bhk?: number;
  furnishing?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
};

interface SearchFiltersProps {
  values: FilterValues;
  onChange: (updates: Partial<FilterValues>) => void;
  onReset: () => void;
  className?: string;
  /** Compact mode for sticky mobile bar */
  compact?: boolean;
}

const PRICE_STEPS: { label: string; min?: number; max?: number }[] = [
  { label: "Under ₹15K", max: 15000 },
  { label: "₹15K – ₹30K", min: 15000, max: 30000 },
  { label: "₹30K – ₹50K", min: 30000, max: 50000 },
  { label: "₹50K – ₹1 L", min: 50000, max: 100000 },
  { label: "₹1 L – ₹2 L", min: 100000, max: 200000 },
  { label: "₹2 L+", min: 200000 },
];

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
        checked
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/60 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function SearchFilters({ values, onChange, onReset, className, compact }: SearchFiltersProps) {
  const inner = (
    <div className={cn("space-y-5", className)}>
      {/* Purpose */}
      <div>
        <Label className="text-xs font-semibold text-foreground">Purpose</Label>
        <div className="mt-2 flex gap-1.5">
          {(["rent", "sale"] as const).map((p) => (
            <FilterCheckbox
              key={p}
              label={p === "rent" ? "For Rent" : "For Sale"}
              checked={values.purpose === p}
              onChange={() => onChange({ purpose: values.purpose === p ? undefined : p })}
            />
          ))}
        </div>
      </div>

      {/* Property Type */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-semibold text-foreground">
          Property Type
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((t) => (
            <FilterCheckbox
              key={t}
              label={PROPERTY_TYPE_LABELS[t]}
              checked={values.type === t}
              onChange={() => onChange({ type: values.type === t ? undefined : t })}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* City */}
      <div>
        <Label className="text-xs font-semibold text-foreground">City</Label>
        <select
          value={values.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value || undefined })}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <Separator />

      {/* BHK */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-semibold text-foreground">
          BHK
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-wrap gap-1.5">
          <FilterCheckbox
            label="Any"
            checked={!values.bhk}
            onChange={() => onChange({ bhk: undefined })}
          />
          {BHK_OPTIONS.map((b) => (
            <FilterCheckbox
              key={b}
              label={b === 6 ? "6+" : `${b}`}
              checked={values.bhk === b}
              onChange={() => onChange({ bhk: values.bhk === b ? undefined : b })}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Furnishing */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-semibold text-foreground">
          Furnishing
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-wrap gap-1.5">
          <FilterCheckbox
            label="Any"
            checked={!values.furnishing}
            onChange={() => onChange({ furnishing: undefined })}
          />
          {FURNISHING.map((f) => (
            <FilterCheckbox
              key={f}
              label={FURNISHING_LABELS[f]}
              checked={values.furnishing === f}
              onChange={() => onChange({ furnishing: values.furnishing === f ? undefined : f })}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Price range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-semibold text-foreground">
          Monthly Rent
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={values.minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <Input
              type="number"
              placeholder="Max"
              value={values.maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {PRICE_STEPS.map((step) => (
              <button
                key={step.label}
                type="button"
                onClick={() =>
                  onChange({
                    minPrice: step.min,
                    maxPrice: step.max,
                  })
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] transition-all",
                  values.minPrice === step.min && values.maxPrice === step.max
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {step.label}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Reset */}
      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={onReset}>
        <RotateCcw className="h-3 w-3" />
        Reset all filters
      </Button>
    </div>
  );

  if (compact) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {Object.values(values).filter(Boolean).length > 0 && (
              <Badge className="ml-1 h-4 w-4 rounded-full p-0 text-[9px] bg-primary text-primary-foreground">
                {Object.values(values).filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-xs overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{inner}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return <div className="space-y-1">{inner}</div>;
}