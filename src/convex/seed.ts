import { Doc, Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { ROLES } from "./schema";

// Curated interior/exterior photography (Unsplash CDN). Used by seed listings;
// user uploads go through Convex storage instead.
const IMG = {
  living1:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=60",
  living2:
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=60",
  living3:
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=60",
  kitchen1:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=60",
  kitchen2:
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=60",
  bedroom1:
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=60",
  bedroom2:
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=60",
  bedroom3:
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=60",
  exterior1:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=60",
  exterior2:
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=60",
  exterior3:
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=60",
  building1:
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=60",
  building2:
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=60",
  villa:
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=60",
  office:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=60",
  balcony:
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=60",
};

type SeedOwner = {
  name: string;
  email: string;
  phone: string;
};

const OWNERS: SeedOwner[] = [
  { name: "Anita Sharma", email: "anita.sharma@estatedirect.example", phone: "+919812345670" },
  { name: "Rohit Malhotra", email: "rohit.malhotra@estatedirect.example", phone: "+919822234567" },
  { name: "Priya Nair", email: "priya.nair@estatedirect.example", phone: "+919830003456" },
  { name: "Vikram Rao", email: "vikram.rao@estatedirect.example", phone: "+919845556789" },
];

type SeedProperty = {
  owner: number; // index into OWNERS
  title: string;
  description: string;
  type: "flat" | "house" | "pg" | "villa" | "commercial";
  listingFor: "rent" | "sale";
  city: string;
  locality: string;
  address: string;
  bhk?: number;
  areaSqft: number;
  furnishing: "furnished" | "semi_furnished" | "unfurnished";
  floor?: number;
  totalFloors?: number;
  ageOfProperty?: number;
  price: number;
  deposit?: number;
  maintenance?: number;
  negotiable: boolean;
  amenities: string[];
  photos: string[];
  isFeatured?: boolean;
  isVerified?: boolean;
  availableInDays?: number;
  views: number;
  daysAgo: number;
};

const P = (
  p: Omit<SeedProperty, "views" | "daysAgo"> & { views?: number; daysAgo?: number },
): SeedProperty => ({ views: 0, daysAgo: 14, ...p });

const PROPERTIES: SeedProperty[] = [
  // ---------- Bangalore ----------
  P({
    owner: 0, title: "Sunlit 2 BHK in HSR Layout with clubhouse access",
    description: "A bright, well-ventilated 2 BHK on the 4th floor of a gated community in Sector 2, HSR Layout. Walking distance to the 27th Main shopping stretch and tech parks. All 3 bedrooms (2 bed + 1 utility) come with modular wardrobes, and the balcony overlooks the central garden. Owner occupied till now — available immediately.",
    type: "flat", listingFor: "rent", city: "Bangalore", locality: "HSR Layout",
    address: "Sector 2, 27th Main Road, HSR Layout, Bangalore", bhk: 2, areaSqft: 1120,
    furnishing: "semi_furnished", floor: 4, totalFloors: 8, ageOfProperty: 4,
    price: 28000, deposit: 200000, maintenance: 2500, negotiable: true,
    amenities: ["Lift", "Parking", "Security", "Power Backup", "Balcony", "Gym"],
    photos: [IMG.living1, IMG.bedroom1, IMG.kitchen1, IMG.balcony],
    isFeatured: true, isVerified: true, availableInDays: 7, views: 342, daysAgo: 2,
  }),
  P({
    owner: 0, title: "Compact 1 BHK near Koramangala 80 ft road",
    description: "Perfect starter home — a tidy 1 BHK with a separate kitchen and a small balcony, 2 minutes from the 80 ft road metro feeder stop. Society has 24x7 security and backup power. Rent includes maintenance; water and electricity billed separately.",
    type: "flat", listingFor: "rent", city: "Bangalore", locality: "Koramangala",
    address: "1st Cross, 6th Block, Koramangala, Bangalore", bhk: 1, areaSqft: 620,
    furnishing: "furnished", floor: 2, totalFloors: 4, ageOfProperty: 6,
    price: 24000, deposit: 150000, maintenance: 1500, negotiable: true,
    amenities: ["Security", "Parking", "WiFi", "Balcony"],
    photos: [IMG.living2, IMG.bedroom3, IMG.kitchen2],
    isVerified: true, views: 211, daysAgo: 5,
  }),
  P({
    owner: 3, title: "Premium 3 BHK corner apartment in Whitefield",
    description: "Spacious corner 3 BHK in a premium Whitefield township with a large living-dining area, master suite with walk-in closet, and a covered balcony. Clubhouse, pool and gym in the complex. Ideal for a family relocating to the IT corridor.",
    type: "flat", listingFor: "rent", city: "Bangalore", locality: "Whitefield",
    address: "Prestige Palm Meadows, Whitefield, Bangalore", bhk: 3, areaSqft: 1650,
    furnishing: "furnished", floor: 11, totalFloors: 18, ageOfProperty: 3,
    price: 46000, deposit: 300000, maintenance: 5000, negotiable: false,
    amenities: ["Swimming Pool", "Gym", "Lift", "Parking", "Security", "Power Backup", "Air Conditioning", "Club House"],
    photos: [IMG.living3, IMG.bedroom2, IMG.kitchen1, IMG.building2],
    isFeatured: true, isVerified: true, views: 428, daysAgo: 1,
  }),
  P({
    owner: 0, title: "Modern 3 BHK for sale in Indiranagar 100 ft road",
    description: "Bank-owned, clear-title 3 BHK in a boutique apartment block on Indiranagar 100 ft road. High rental yield locality; society is well-maintained with a small gym and ample parking. Price is firm.",
    type: "flat", listingFor: "sale", city: "Bangalore", locality: "Indiranagar",
    address: "100 Feet Road, Indiranagar, Bangalore", bhk: 3, areaSqft: 1780,
    furnishing: "semi_furnished", floor: 5, totalFloors: 7, ageOfProperty: 8,
    price: 17500000, negotiable: false,
    amenities: ["Lift", "Parking", "Security", "Power Backup", "Gym"],
    photos: [IMG.exterior2, IMG.living1, IMG.bedroom1],
    isFeatured: true, isVerified: true, views: 517, daysAgo: 8,
  }),
  P({
    owner: 3, title: "Affordable 2 BHK near Electronic City phase 1",
    description: "Value-for-money 2 BHK in a quiet layout 10 minutes from Electronic City Phase 1 gate. Good ventilation, covered parking, and a functional kitchen. Ideal for IT professionals looking to live near work without burning the budget.",
    type: "flat", listingFor: "rent", city: "Bangalore", locality: "Electronic City",
    address: "Neeladri Road, Electronic City Phase 1, Bangalore", bhk: 2, areaSqft: 950,
    furnishing: "semi_furnished", floor: 3, totalFloors: 5, ageOfProperty: 5,
    price: 18500, deposit: 100000, maintenance: 1200, negotiable: true,
    amenities: ["Parking", "Security", "Power Backup", "Balcony"],
    photos: [IMG.bedroom3, IMG.kitchen2, IMG.living2],
    views: 176, daysAgo: 10,
  }),
  P({
    owner: 0, title: "Luxury 4 BHK villa in Hebbal with private garden",
    description: "A rare find — an independent 4 BHK villa in a gated Hebbal enclave with a private garden, servant quarter and 2 covered parking slots. Double-height living room, Italian marble flooring, and a modular kitchen. Rent includes society maintenance; pool access available for residents.",
    type: "villa", listingFor: "rent", city: "Bangalore", locality: "Hebbal",
    address: "Hebbal Kempapura, Bangalore", bhk: 4, areaSqft: 3400,
    furnishing: "furnished", ageOfProperty: 2,
    price: 95000, deposit: 600000, maintenance: 8000, negotiable: true,
    amenities: ["Swimming Pool", "Gym", "Parking", "Security", "Garden", "Air Conditioning", "Club House", "Pet Friendly"],
    photos: [IMG.villa, IMG.exterior1, IMG.living1, IMG.kitchen1],
    isFeatured: true, isVerified: true, views: 689, daysAgo: 3,
  }),
  P({
    owner: 3, title: "Fully furnished PG for working professionals, Marathahalli",
    description: "Fully furnished PG with 4 sharing options (2/3/4 sharing) in Marathahalli, 5 mins from the Outer Ring Road tech parks. Includes housekeeping, high-speed WiFi, meals (veg/non-veg), washing machine and 24x7 security. Couples allowed in select rooms.",
    type: "pg", listingFor: "rent", city: "Bangalore", locality: "Marathahalli",
    address: "2nd Cross, Marathahalli, Bangalore", areaSqft: 1400,
    furnishing: "furnished", floor: 1, totalFloors: 3, ageOfProperty: 3,
    price: 12000, deposit: 10000, maintenance: 0, negotiable: false,
    amenities: ["WiFi", "Security", "Washing Machine", "CCTV", "Power Backup"],
    photos: [IMG.bedroom2, IMG.living3, IMG.kitchen2],
    views: 243, daysAgo: 6,
  }),
  P({
    owner: 0, title: "Elegant 4 BHK duplex for sale in Jayanagar 4th Block",
    description: "Duplex 4 BHK in a prime Jayanagar residential street. South-facing, abundant light, terracotta accents. Clear title, ready to register. Suitable for end-use or a high-yield rental near the upcoming metro line.",
    type: "house", listingFor: "sale", city: "Bangalore", locality: "Jayanagar",
    address: "4th Block, Jayanagar, Bangalore", bhk: 4, areaSqft: 2650,
    furnishing: "unfurnished", ageOfProperty: 12,
    price: 32000000, negotiable: true,
    amenities: ["Parking", "Security", "Garden", "Balcony"],
    photos: [IMG.exterior3, IMG.living2, IMG.bedroom1, IMG.balcony],
    isVerified: true, views: 305, daysAgo: 12,
  }),

  // ---------- Mumbai ----------
  P({
    owner: 1, title: "Sea-facing 2 BHK in Andheri West, near Versova",
    description: "Unobstructed sea-view 2 BHK on a high floor in a boutique Andheri West building. Floor-to-ceiling windows, mod kitchen, and reserved parking. 5 minutes to Versova metro and beach promenade. Families preferred.",
    type: "flat", listingFor: "rent", city: "Mumbai", locality: "Andheri West",
    address: "Four Bungalows, Andheri West, Mumbai", bhk: 2, areaSqft: 980,
    furnishing: "furnished", floor: 12, totalFloors: 16, ageOfProperty: 6,
    price: 42000, deposit: 250000, maintenance: 3500, negotiable: true,
    amenities: ["Lift", "Parking", "Security", "Power Backup", "Balcony"],
    photos: [IMG.living1, IMG.balcony, IMG.bedroom2, IMG.kitchen1],
    isFeatured: true, isVerified: true, views: 521, daysAgo: 2,
  }),
  P({
    owner: 1, title: "Spacious 3 BHK in Powai with lake-facing balcony",
    description: "Beautifully maintained 3 BHK in a Powai society overlooking the lake. Modular kitchen, all bedrooms carpeted, gym and pool in the complex. Close to Hiranandani business district and IIT Powai.",
    type: "flat", listingFor: "rent", city: "Mumbai", locality: "Powai",
    address: "Hiranandani Gardens, Powai, Mumbai", bhk: 3, areaSqft: 1450,
    furnishing: "semi_furnished", floor: 9, totalFloors: 12, ageOfProperty: 9,
    price: 85000, deposit: 400000, maintenance: 6000, negotiable: false,
    amenities: ["Swimming Pool", "Gym", "Lift", "Parking", "Security", "Power Backup"],
    photos: [IMG.living2, IMG.kitchen1, IMG.bedroom3, IMG.building1],
    isVerified: true, views: 402, daysAgo: 4,
  }),
  P({
    owner: 1, title: "Premium 2 BHK for sale in Bandra West",
    description: "Rare 2 BHK in a low-rise Bandra West building with lift. High street, high rental demand — perfect for investment or a stylish home. Clear title, no broker involvement, direct owner deal.",
    type: "flat", listingFor: "sale", city: "Mumbai", locality: "Bandra West",
    address: "Pali Hill Road, Bandra West, Mumbai", bhk: 2, areaSqft: 1010,
    furnishing: "semi_furnished", floor: 3, totalFloors: 5, ageOfProperty: 14,
    price: 45000000, negotiable: true,
    amenities: ["Lift", "Parking", "Security", "Power Backup"],
    photos: [IMG.exterior1, IMG.living3, IMG.bedroom1],
    isFeatured: true, isVerified: true, views: 634, daysAgo: 7,
  }),
  P({
    owner: 1, title: "Compact 1 BHK in Worli, ready to move in",
    description: "Smart 1 BHK in Worli with excellent connectivity to South Mumbai and the coastal road. Recently painted, new kitchen counters, and a small balcony. Rent includes society charges.",
    type: "flat", listingFor: "rent", city: "Mumbai", locality: "Worli",
    address: "Dr. Annie Besant Road, Worli, Mumbai", bhk: 1, areaSqft: 540,
    furnishing: "furnished", floor: 7, totalFloors: 21, ageOfProperty: 5,
    price: 65000, deposit: 350000, maintenance: 3000, negotiable: true,
    amenities: ["Lift", "Security", "Power Backup", "Gym", "Balcony"],
    photos: [IMG.bedroom3, IMG.living1, IMG.kitchen2],
    views: 289, daysAgo: 9,
  }),
  P({
    owner: 1, title: "Full-floor commercial office for rent in Goregaon East",
    description: "Entire floor (2,800 sq ft) of ready-to-occupy office space in a Grade-A Goregaon East commercial building. 200+ car parking, 100% power backup, high-speed lifts. Suitable for corporate offices or co-working operators. Direct owner lease, no brokerage.",
    type: "commercial", listingFor: "rent", city: "Mumbai", locality: "Goregaon East",
    address: "LBS Marg, Goregaon East, Mumbai", areaSqft: 2800,
    furnishing: "unfurnished", floor: 4, totalFloors: 10, ageOfProperty: 7,
    price: 125000, deposit: 750000, maintenance: 15000, negotiable: true,
    amenities: ["Parking", "Security", "Power Backup", "Lift", "CCTV"],
    photos: [IMG.office, IMG.building2, IMG.living2],
    isVerified: true, views: 198, daysAgo: 11,
  }),
  P({
    owner: 1, title: "New 3 BHK in Thane West with city views",
    description: "Brand-new 3 BHK on a high floor in a Thane West township — city and lake views. Society amenities include a rooftop pool, gym, and kids' play area. Ready possession. Rent negotiable for a good family.",
    type: "flat", listingFor: "rent", city: "Mumbai", locality: "Thane West",
    address: "Kolshet Road, Thane West, Mumbai", bhk: 3, areaSqft: 1350,
    furnishing: "unfurnished", floor: 17, totalFloors: 32, ageOfProperty: 1,
    price: 55000, deposit: 300000, maintenance: 4500, negotiable: true,
    amenities: ["Swimming Pool", "Gym", "Lift", "Parking", "Security", "Club House"],
    photos: [IMG.living3, IMG.kitchen1, IMG.bedroom2, IMG.building2],
    isFeatured: true, views: 356, daysAgo: 3,
  }),

  // ---------- Delhi NCR ----------
  P({
    owner: 2, title: "Well-kept 3 BHK in Dwarka Sector 12",
    description: "Bright 3 BHK in a green Dwarka sector with metro within walking distance. All rooms face the park. Society has a gym, badminton court and 24x7 security. Ideal for a family; owner handles directly.",
    type: "flat", listingFor: "rent", city: "Delhi NCR", locality: "Dwarka",
    address: "Sector 12, Dwarka, New Delhi", bhk: 3, areaSqft: 1240,
    furnishing: "semi_furnished", floor: 6, totalFloors: 10, ageOfProperty: 8,
    price: 32000, deposit: 150000, maintenance: 3000, negotiable: true,
    amenities: ["Lift", "Parking", "Security", "Power Backup", "Gym", "Balcony"],
    photos: [IMG.living1, IMG.bedroom1, IMG.kitchen2],
    isVerified: true, views: 265, daysAgo: 5,
  }),
  P({
    owner: 2, title: "Corporate-style 2 BHK in Gurgaon Sector 21",
    description: "2 BHK apartment in a premium Gurgaon society — the classic corporate relocation pick. Modular kitchen, two balconies, covered parking, and a clubhouse with pool. Close to the metro and Cyber City.",
    type: "flat", listingFor: "rent", city: "Delhi NCR", locality: "Gurgaon Sector 21",
    address: "Sector 21, Gurugram", bhk: 2, areaSqft: 1180,
    furnishing: "furnished", floor: 8, totalFloors: 14, ageOfProperty: 6,
    price: 38000, deposit: 200000, maintenance: 4000, negotiable: false,
    amenities: ["Swimming Pool", "Gym", "Lift", "Parking", "Security", "Power Backup", "Air Conditioning"],
    photos: [IMG.living2, IMG.bedroom2, IMG.kitchen1, IMG.building1],
    isFeatured: true, isVerified: true, views: 473, daysAgo: 1,
  }),
  P({
    owner: 2, title: "Big 3 BHK for sale in Noida Sector 62",
    description: "Corner 3 BHK with 3 parking slots in a low-density Noida Sector 62 society. Clear title, no dues, ready for registration. Great option for a Delhi NCR home at a sensible price.",
    type: "flat", listingFor: "sale", city: "Delhi NCR", locality: "Noida Sector 62",
    address: "Sector 62, Noida", bhk: 3, areaSqft: 1620,
    furnishing: "unfurnished", floor: 5, totalFloors: 9, ageOfProperty: 10,
    price: 12000000, negotiable: true,
    amenities: ["Lift", "Parking", "Security", "Power Backup", "Garden"],
    photos: [IMG.exterior2, IMG.living3, IMG.bedroom3],
    isVerified: true, views: 312, daysAgo: 10,
  }),
  P({
    owner: 2, title: "Quiet 2 BHK in Saket near the metro",
    description: "Serene 2 BHK in a tree-lined Saket lane, 8 minutes from the metro. Wooden flooring, two balconies, and a dedicated parking slot. Walking distance to Select Citywalk and Saket malls.",
    type: "flat", listingFor: "rent", city: "Delhi NCR", locality: "Saket",
    address: "Press Enclave Road, Saket, New Delhi", bhk: 2, areaSqft: 1090,
    furnishing: "semi_furnished", floor: 2, totalFloors: 4, ageOfProperty: 11,
    price: 45000, deposit: 250000, maintenance: 2500, negotiable: true,
    amenities: ["Parking", "Security", "Balcony", "Pet Friendly"],
    photos: [IMG.bedroom1, IMG.living1, IMG.balcony],
    isVerified: true, views: 221, daysAgo: 8,
  }),
  P({
    owner: 2, title: "Grand 5 BHK villa for sale in Greater Kailash",
    description: "An exceptional standalone villa in Greater Kailash II — 5 bedrooms, private driveway, landscaped garden and a rooftop terrace. Quiet, posh, secure. Serious buyers only, direct owner sale.",
    type: "villa", listingFor: "sale", city: "Delhi NCR", locality: "Greater Kailash",
    address: "Greater Kailash II, New Delhi", bhk: 5, areaSqft: 5200,
    furnishing: "semi_furnished", ageOfProperty: 15,
    price: 120000000, negotiable: false,
    amenities: ["Parking", "Security", "Garden", "Power Backup", "Pet Friendly"],
    photos: [IMG.villa, IMG.exterior3, IMG.living2, IMG.bedroom2],
    isFeatured: true, isVerified: true, views: 748, daysAgo: 4,
  }),
  P({
    owner: 2, title: "Budget 1 BHK in Rohini Sector 9",
    description: "Simple, clean 1 BHK in Rohini Sector 9 with a separate kitchen and balcony. Nearby metro and weekly market. Rent is low because the owner handles everything directly — no brokerage anywhere.",
    type: "flat", listingFor: "rent", city: "Delhi NCR", locality: "Rohini",
    address: "Sector 9, Rohini, New Delhi", bhk: 1, areaSqft: 480,
    furnishing: "unfurnished", floor: 1, totalFloors: 3, ageOfProperty: 9,
    price: 16000, deposit: 60000, maintenance: 800, negotiable: true,
    amenities: ["Parking", "Security"],
    photos: [IMG.kitchen2, IMG.bedroom3, IMG.living3],
    views: 149, daysAgo: 13,
  }),

  // ---------- Pune ----------
  P({
    owner: 3, title: "Charming 2 BHK in Koregaon Park",
    description: "Character-filled 2 BHK on a leafy Koregaon Park lane — high ceilings, wooden floors, and a sunny sit-out. Walking distance to the river promenade and North Main Road cafés. Owner-managed, no brokerage.",
    type: "flat", listingFor: "rent", city: "Pune", locality: "Koregaon Park",
    address: "Lane 6, Koregaon Park, Pune", bhk: 2, areaSqft: 1050,
    furnishing: "furnished", floor: 2, totalFloors: 3, ageOfProperty: 7,
    price: 35000, deposit: 200000, maintenance: 2000, negotiable: true,
    amenities: ["Parking", "Security", "Garden", "Pet Friendly", "Balcony"],
    photos: [IMG.living1, IMG.bedroom3, IMG.kitchen1, IMG.balcony],
    isFeatured: true, isVerified: true, views: 387, daysAgo: 2,
  }),
  P({
    owner: 3, title: "New 3 BHK near Hinjewadi IT park",
    description: "Three months old, never-occupied 3 BHK in a Hinjewadi Phase 2 society. Rooftop views of the IT park, clubhouse and gym downstairs. Perfect for tech professionals — direct owner deal.",
    type: "flat", listingFor: "rent", city: "Pune", locality: "Hinjewadi",
    address: "Phase 2, Hinjewadi, Pune", bhk: 3, areaSqft: 1280,
    furnishing: "unfurnished", floor: 14, totalFloors: 18, ageOfProperty: 0,
    price: 30000, deposit: 150000, maintenance: 3500, negotiable: true,
    amenities: ["Swimming Pool", "Gym", "Lift", "Parking", "Security", "Power Backup", "Club House"],
    photos: [IMG.living2, IMG.kitchen1, IMG.bedroom1, IMG.building1],
    views: 268, daysAgo: 6,
  }),
  P({
    owner: 3, title: "Stylish 2 BHK for sale in Baner",
    description: "Design-forward 2 BHK in a compact Baner society — excellent orientation, big balconies, and a high-end kitchen. 95% occupied complex with a strong resale record. Direct owner sale.",
    type: "flat", listingFor: "sale", city: "Pune", locality: "Baner",
    address: "Baner Road, Baner, Pune", bhk: 2, areaSqft: 1150,
    furnishing: "semi_furnished", floor: 6, totalFloors: 12, ageOfProperty: 5,
    price: 9500000, negotiable: true,
    amenities: ["Lift", "Parking", "Security", "Gym", "Power Backup", "Balcony"],
    photos: [IMG.exterior1, IMG.living3, IMG.bedroom2],
    isVerified: true, views: 284, daysAgo: 9,
  }),
  P({
    owner: 3, title: "Smart 1 BHK in Kharadi near the tech hub",
    description: "Compact and efficient 1 BHK in Kharadi — 5 minutes from the EON IT park. Furnished, with AC in the bedroom, and a dedicated bike parking. Couples and bachelors welcome.",
    type: "flat", listingFor: "rent", city: "Pune", locality: "Kharadi",
    address: "Kharadi Bypass, Kharadi, Pune", bhk: 1, areaSqft: 560,
    furnishing: "furnished", floor: 3, totalFloors: 7, ageOfProperty: 4,
    price: 20000, deposit: 90000, maintenance: 1500, negotiable: true,
    amenities: ["Lift", "Parking", "Security", "Air Conditioning", "WiFi"],
    photos: [IMG.bedroom2, IMG.living1, IMG.kitchen2],
    views: 197, daysAgo: 11,
  }),
];

/** Idempotent seed: no-ops if any properties already exist. */
export const runSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("properties").first();
    if (existing) return { inserted: 0, properties: existing ? 1 : 0 };

    const now = Date.now();
    const ownerIds: Id<"users">[] = [];

    for (const owner of OWNERS) {
      const email = owner.email;
      const found = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
      const id =
        found?._id ??
        (await ctx.db.insert("users", {
          name: owner.name,
          email,
          role: ROLES.OWNER,
          phone: owner.phone,
          isVerified: true,
        }));
      ownerIds.push(id);
    }

    for (const p of PROPERTIES) {
      const created = now - p.daysAgo * 86_400_000;
      const insert: Omit<Doc<"properties">, "_id" | "_creationTime"> = {
        ownerId: ownerIds[p.owner],
        title: p.title,
        type: p.type,
        listingFor: p.listingFor,
        city: p.city,
        locality: p.locality,
        address: p.address,
        areaSqft: p.areaSqft,
        furnishing: p.furnishing,
        price: p.price,
        negotiable: p.negotiable,
        amenities: p.amenities,
        photos: p.photos,
        phoneNumber: "9999999999",
        status: "live",
        isVerified: p.isVerified ?? false,
        isFeatured: p.isFeatured ?? false,
        viewCount: p.views,
        createdAt: created,
        updatedAt: created,
      };
      // Convex rejects `undefined` — omit optional keys entirely.
      if (p.description) insert.description = p.description;
      if (p.bhk != null) insert.bhk = p.bhk;
      if (p.floor != null) insert.floor = p.floor;
      if (p.totalFloors != null) insert.totalFloors = p.totalFloors;
      if (p.ageOfProperty != null) insert.ageOfProperty = p.ageOfProperty;
      if (p.deposit != null) insert.deposit = p.deposit;
      if (p.maintenance != null) insert.maintenance = p.maintenance;
      if (p.availableInDays != null) insert.availableFrom = now + p.availableInDays * 86_400_000;
      await ctx.db.insert("properties", insert);
    }

    return { inserted: PROPERTIES.length, owners: ownerIds.length };
  },
});
