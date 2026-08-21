import { z } from "zod";

// Shared EstateDirect domain constants, validation, and formatters.
// Imported by the client forms AND the Convex backend so the two never
// disagree about what a valid listing looks like.

export const CITIES = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
] as const;

export const LOCALITIES: Record<string, string[]> = {
  Bangalore: [
    "HSR Layout",
    "Koramangala",
    "Indiranagar",
    "Whitefield",
    "Electronic City",
    "Jayanagar",
    "Malleshwaram",
    "Marathahalli",
    "Hebbal",
    "Bellandur",
    "BTM Layout",
  ],
  Mumbai: [
    "Andheri West",
    "Bandra West",
    "Powai",
    "Worli",
    "Chembur",
    "Thane West",
    "Goregaon East",
    "Lower Parel",
    "Juhu",
    "Malad West",
  ],
  "Delhi NCR": [
    "Dwarka",
    "Rohini",
    "Saket",
    "Gurgaon Sector 21",
    "Noida Sector 62",
    "Greater Kailash",
    "Janakpuri",
    "Lajpat Nagar",
    "Vasant Kunj",
    "Pitampura",
  ],
  Pune: ["Koregaon Park", "Baner", "Hinjewadi", "Kharadi", "Wakad", "Aundh", "Viman Nagar", "Hadapsar"],
  Hyderabad: ["Gachibowli", "Hitech City", "Banjara Hills", "Madhapur", "Kondapur", "Secunderabad"],
  Chennai: ["OMR", "Velachery", "Adyar", "T. Nagar", "Anna Nagar", "Porur"],
  Kolkata: ["Salt Lake", "New Town", "Ballygunge", "Alipore", "Gariahat", "Behala"],
};

export const PROPERTY_TYPES = ["flat", "house", "pg", "villa", "commercial"] as const;
export const PROPERTY_TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  flat: "Flat / Apartment",
  house: "Independent House",
  pg: "PG / Hostel",
  villa: "Villa",
  commercial: "Commercial",
};

export const LISTING_FOR = ["rent", "sale"] as const;
export const PURPOSE_LABELS: Record<(typeof LISTING_FOR)[number], string> = {
  rent: "For Rent",
  sale: "For Sale",
};

export const FURNISHING = ["furnished", "semi_furnished", "unfurnished"] as const;
export const FURNISHING_LABELS: Record<(typeof FURNISHING)[number], string> = {
  furnished: "Furnished",
  semi_furnished: "Semi-furnished",
  unfurnished: "Unfurnished",
};

export const LISTING_STATUS = ["pending", "live", "rejected", "expired"] as const;
export const STATUS_LABELS: Record<(typeof LISTING_STATUS)[number], string> = {
  pending: "Pending review",
  live: "Live",
  rejected: "Rejected",
  expired: "Expired",
};

export const SORT_OPTIONS = ["newest", "popular", "price_asc", "price_desc"] as const;
export const SORT_LABELS: Record<(typeof SORT_OPTIONS)[number], string> = {
  newest: "Newest first",
  popular: "Most viewed",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

export const AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Lift",
  "Parking",
  "Security",
  "Power Backup",
  "Air Conditioning",
  "Balcony",
  "Furnished Kitchen",
  "Washing Machine",
  "WiFi",
  "CCTV",
  "Club House",
  "Garden",
  "Pet Friendly",
  "Water Storage",
] as const;

export const BHK_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

// --- Zod schema shared by the post-property form and the Convex mutation ---

const sanitize = (value: string) =>
  value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export const propertyInputSchema = z.object({
  phoneNumber: z
  .string()
  .trim()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number is too long")
  .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  title: z
    .string()
    .min(6, "Give your listing a clear title (min 6 characters)")
    .max(80, "Title must be under 80 characters")
    .transform(sanitize),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .transform(sanitize)
    .optional(),
  type: z.enum(PROPERTY_TYPES),
  listingFor: z.enum(LISTING_FOR),
  city: z.enum(CITIES),
  locality: z
    .string()
    .min(2, "Locality is required")
    .max(60)
    .transform(sanitize),
  address: z
    .string()
    .min(5, "Street address is required")
    .max(200)
    .transform(sanitize),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  bhk: z.number().int().min(1).max(6).optional(),
  areaSqft: z
    .number()
    .int()
    .min(50, "Area should be at least 50 sq ft")
    .max(100_000),
  furnishing: z.enum(FURNISHING),
  floor: z.number().int().min(0).max(200).optional(),
  totalFloors: z.number().int().min(1).max(200).optional(),
  ageOfProperty: z.number().int().min(0).max(100).optional(),
  price: z
    .number()
    .int()
    .min(1000, "Price seems too low")
    .max(50_000_000_000),
  deposit: z.number().int().min(0).optional(),
  maintenance: z.number().int().min(0).optional(),
  negotiable: z.boolean(),
  amenities: z.array(z.enum(AMENITIES)).max(16),
  photos: z
    .array(z.string())
    .min(1, "Add at least one photo")
    .max(15, "Maximum 15 photos"),
  videoUrl: z
    .string()
    .url("Enter a valid video link (optional)")
    .or(z.literal(""))
    .optional(),
  availableFrom: z.number().optional(),
});

export type PropertyInput = z.infer<typeof propertyInputSchema>;

// --- Formatters ---

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact Indian format: ₹1.2 Cr, ₹85 L, ₹24.5K */
export function formatPriceCompact(value: number): string {
  if (value >= 10_000_000) {
    return `₹${trimZero((value / 10_000_000).toFixed(2))} Cr`;
  }
  if (value >= 100_000) {
    return `₹${trimZero((value / 100_000).toFixed(2))} L`;
  }
  if (value >= 1_000) {
    return `₹${trimZero((value / 1_000).toFixed(1))}K`;
  }
  return `₹${value}`;
}

function trimZero(value: string): string {
  return value.replace(/\.0$/, "").replace(/(\.\d)0$/, "$1");
}

export function formatArea(value: number): string {
  return `${new Intl.NumberFormat("en-IN").format(value)} sq.ft`;
}

/** 98XXXXXX10 — full numbers are never sent to the client before unlock. */
export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `${digits.slice(0, 2)}XXXXXX${digits.slice(-2)}`;
}

export function formatDate(ts?: number | null): string {
  if (!ts) return "Immediately";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
}

export function initials(name?: string | null): string {
  if (!name) return "O";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
