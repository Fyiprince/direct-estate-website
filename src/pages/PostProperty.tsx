import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LocationPicker } from "@/components/property/location-picker";
import { PropertyImage } from "@/components/property/property-image";
import { cn } from "@/lib/utils";

import {
  CITIES,
  LOCALITIES,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  LISTING_FOR,
  PURPOSE_LABELS,
  FURNISHING,
  FURNISHING_LABELS,
  AMENITIES,
  BHK_OPTIONS,
  propertyInputSchema,
  formatINR,
} from "@/lib/property";

import {
  Building2,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
  Upload,
  Loader2,
  Home,
  Store,
  Users,
  Trees,
} from "lucide-react";

type WizardData = {
  listingFor?: "rent" | "sale";
  type?: (typeof PROPERTY_TYPES)[number];
  city?: string;
  locality?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  title?: string;
  description?: string;
  bhk?: number;
  areaSqft?: number;
  furnishing?: (typeof FURNISHING)[number];
  floor?: number;
  totalFloors?: number;
  ageOfProperty?: number;
  price?: number;
  deposit?: number;
  maintenance?: number;
  negotiable?: boolean;
  amenities: string[];
  photos: string[];
  videoUrl?: string;
  phoneNumber?: string;
  availableFrom?: string;
};

const STEPS = [
  "Purpose & Type",
  "Location",
  "Details",
  "Pricing",
  "Photos",
  "Review",
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flat: <Building2 className="h-6 w-6" />,
  house: <Home className="h-6 w-6" />,
  pg: <Users className="h-6 w-6" />,
  villa: <Trees className="h-6 w-6" />,
  commercial: <Store className="h-6 w-6" />,
};

export default function PostProperty() {
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");

  const navigate = useNavigate();
  const { user } = useAuth();

  const createProperty = useMutation(
    api.properties.createProperty,
  );

  const updateProperty = useMutation(
    api.properties.updateProperty,
  );

  const propertyId = editId
    ? (editId as Id<"properties">)
    : null;

  const existingProperty = useQuery(
    api.properties.get,
    propertyId ? { id: propertyId } : "skip",
  );

  const generateUploadUrl = useMutation(
    api.properties.generateUploadUrl,
  );

  const [step, setStep] = useState(0);

  const [data, setData] = useState<WizardData>({
    listingFor: undefined,
    type: undefined,
    amenities: [],
    photos: [],
    negotiable: true,
    phoneNumber: "",
  });

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [submitting, setSubmitting] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  // ------------------------------------------------------------
  // Load existing property when editing
  // ------------------------------------------------------------

  useEffect(() => {
    if (!existingProperty) return;

    const safePhotos = Array.from(
  existingProperty.photos ?? [],
).filter(
  (photo): photo is string =>
    typeof photo === "string" &&
    photo.length > 0,
);

    setData({
      listingFor: existingProperty.listingFor,
      type: existingProperty.type,

      city: existingProperty.city,
      locality: existingProperty.locality,
      address: existingProperty.address,

      latitude: existingProperty.latitude,
      longitude: existingProperty.longitude,

      title: existingProperty.title,
      description: existingProperty.description,

      bhk: existingProperty.bhk,
      areaSqft: existingProperty.areaSqft,

      furnishing: existingProperty.furnishing,

      floor: existingProperty.floor,
      totalFloors: existingProperty.totalFloors,

      ageOfProperty:
        existingProperty.ageOfProperty,

      price: existingProperty.price,
      deposit: existingProperty.deposit,
      maintenance: existingProperty.maintenance,

      negotiable:
        existingProperty.negotiable ?? true,

      amenities:
        existingProperty.amenities ?? [],

      photos: safePhotos,

      videoUrl: existingProperty.videoUrl,

      /*
       * phoneNumber is intentionally not read from
       * the public property query.
       *
       * The user can enter the contact number again
       * while editing the listing.
       */
      phoneNumber: "",

      availableFrom:
        existingProperty.availableFrom
          ? new Date(
              existingProperty.availableFrom,
            )
              .toISOString()
              .split("T")[0]
          : undefined,
    });
  }, [existingProperty]);

  // ------------------------------------------------------------
  // Update form state
  // ------------------------------------------------------------

  const update = (
    updates: Partial<WizardData>,
  ) => {
    setData((prev) => ({
      ...prev,
      ...updates,
    }));

    setErrors({});
  };

  // ------------------------------------------------------------
  // Photo upload
  // ------------------------------------------------------------

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      setUploading(true);

      const newIds: string[] = [];

      try {
        for (const file of Array.from(files)) {
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
          ];

          const maxSize =
            5 * 1024 * 1024;

          if (!allowedTypes.includes(file.type)) {
            throw new Error(
              `${file.name}: Only JPEG, PNG or WebP images are allowed`,
            );
          }

          if (file.size > maxSize) {
            throw new Error(
              `${file.name}: Image must be 5 MB or smaller`,
            );
          }

          const uploadUrl =
            await generateUploadUrl();

          const response = await fetch(
            uploadUrl,
            {
              method: "POST",
              headers: {
                "Content-Type": file.type,
              },
              body: file,
            },
          );

          if (!response.ok) {
            throw new Error(
              `Upload failed: ${response.statusText}`,
            );
          }

          const { storageId } =
            await response.json();

          if (
            typeof storageId !== "string"
          ) {
            throw new Error(
              "Invalid storage ID returned from upload",
            );
          }

          newIds.push(storageId);
        }

        setData((prev) => ({
          ...prev,
          photos: [
            ...prev.photos,
            ...newIds,
          ],
        }));

        toast.success(
          `${newIds.length} photo${
            newIds.length > 1 ? "s" : ""
          } uploaded`,
        );
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to upload photos",
        );

        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl],
  );

  // ------------------------------------------------------------
  // Remove photo
  // ------------------------------------------------------------

  const removePhoto = (
    index: number,
  ) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  // ------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------

  const validateStep = (): boolean => {
    const e: Record<
      string,
      string
    > = {};

    if (step === 0) {
      if (!data.listingFor) {
        e.listingFor =
          "Select Rent or Sale";
      }

      if (!data.type) {
        e.type =
          "Select property type";
      }
    }

    if (step === 1) {
      if (!data.city) {
        e.city = "Select a city";
      }

      if (!data.locality) {
        e.locality =
          "Enter locality";
      }

      if (!data.address) {
        e.address =
          "Enter address";
      }

      if (
        data.latitude == null ||
        data.longitude == null
      ) {
        e.location =
          "Drop a pin on the map (or type coordinates)";
      }
    }

    if (step === 2) {
      if (
        !data.title ||
        data.title.length < 6
      ) {
        e.title =
          "Min 6 characters for title";
      }

      if (
        !data.areaSqft ||
        data.areaSqft < 50
      ) {
        e.areaSqft =
          "Area must be at least 50 sq ft";
      }

      if (!data.furnishing) {
        e.furnishing =
          "Select furnishing";
      }

      const phone =
        data.phoneNumber?.trim() ?? "";

      if (!phone) {
        e.phoneNumber =
          "Phone number is required";
      } else if (
        !/^[0-9]{10}$/.test(phone)
      ) {
        e.phoneNumber =
          "Enter a valid 10-digit phone number";
      }
    }

    if (step === 3) {
      if (
        !data.price ||
        data.price < 1000
      ) {
        e.price =
          "Enter a valid price (min ₹1,000)";
      }
    }

    if (step === 4) {
      if (data.photos.length === 0) {
        e.photos =
          "Add at least one photo";
      }
    }

    setErrors(e);

    return (
      Object.keys(e).length === 0
    );
  };

  const next = () => {
    if (validateStep()) {
      setStep((s) =>
        Math.min(
          s + 1,
          STEPS.length - 1,
        ),
      );
    }
  };

  const prev = () => {
    setStep((s) =>
      Math.max(s - 1, 0),
    );
  };

  // ------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------

  const handleSubmit = async () => {
    if (submitting) return;

    if (!user) {
      navigate(
        "/auth?returnTo=/post-property",
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...data,

        availableFrom:
          data.availableFrom
            ? new Date(
                data.availableFrom,
              ).getTime()
            : undefined,
      };

      const parsed =
        propertyInputSchema.safeParse(
          payload,
        );

      if (!parsed.success) {
        const first =
          parsed.error.issues[0];

        toast.error(
          first?.message ??
            "Invalid form data",
        );

        setSubmitting(false);
        return;
      }

      if (editId) {
        await updateProperty({
          id: editId as Id<"properties">,
          input: parsed.data,
        });

        toast.success(
          "Listing updated successfully",
        );
      } else {
        await createProperty({
          input: parsed.data,
        });

        toast.success(
          "Listing submitted for review",
        );
      }

      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : editId
            ? "Failed to update listing"
            : "Failed to create listing",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Post your property
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            List directly to thousands of
            renters — every listing is reviewed
            by an admin before it goes live.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-2 flex-1"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  i < step &&
                    "bg-primary text-primary-foreground",
                  i === step &&
                    "bg-primary/10 text-primary border-2 border-primary",
                  i > step &&
                    "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>

              <span
                className={cn(
                  "hidden sm:inline text-xs font-medium",
                  i <= step
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>

              {i <
                STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    i < step
                      ? "bg-primary"
                      : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                {step === 0 && (
                  <StepPurpose
                    data={data}
                    update={update}
                    errors={errors}
                  />
                )}

                {step === 1 && (
                  <StepLocation
                    data={data}
                    update={update}
                    errors={errors}
                  />
                )}

                {step === 2 && (
                  <StepDetails
                    data={data}
                    update={update}
                    errors={errors}
                  />
                )}

                {step === 3 && (
                  <StepPricing
                    data={data}
                    update={update}
                    errors={errors}
                  />
                )}

                {step === 4 && (
                  <StepPhotos
                    data={data}
                    update={update}
                    onUpload={handleUpload}
                    removePhoto={removePhoto}
                    uploading={uploading}
                    errors={errors}
                  />
                )}

                {step === 5 && (
                  <StepReview
                    data={data}
                    openStep={setStep}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="text-xs text-muted-foreground">
            Step {step + 1} of{" "}
            {STEPS.length}
          </div>

          {step <
          STEPS.length - 1 ? (
            <Button
              onClick={next}
              className="gap-1"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}

              {submitting
                ? editId
                  ? "Updating..."
                  : "Posting..."
                : editId
                  ? "Update listing"
                  : "Post listing"}
            </Button>
          )}
        </div>
      </main>

      <SiteFooter />
    </motion.div>
  );
}

// ============================================================
// Step 0
// ============================================================

function StepPurpose({
  data,
  update,
  errors,
}: {
  data: WizardData;
  update: (
    u: Partial<WizardData>,
  ) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">
          Are you listing for rent or sale?
        </Label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {LISTING_FOR.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                update({
                  listingFor: p,
                })
              }
              className={cn(
                "rounded-xl border-2 p-4 text-center transition-all",
                data.listingFor === p
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-muted-foreground/30",
              )}
            >
              <span className="text-lg font-semibold text-foreground">
                {PURPOSE_LABELS[p]}
              </span>

              <p className="text-xs text-muted-foreground mt-1">
                {p === "rent"
                  ? "Set monthly rent"
                  : "Set total price"}
              </p>
            </button>
          ))}
        </div>

        {errors.listingFor && (
          <p className="text-xs text-destructive mt-1">
            {errors.listingFor}
          </p>
        )}
      </div>

      <Separator />

      <div>
        <Label className="text-base font-semibold">
          Property type
        </Label>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                update({ type: t })
              }
              className={cn(
                "rounded-xl border-2 p-3 text-center transition-all",
                data.type === t
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-muted-foreground/30",
              )}
            >
              <div className="flex justify-center text-primary">
                {TYPE_ICONS[t]}
              </div>

              <span className="mt-1 text-xs font-medium text-foreground">
                {PROPERTY_TYPE_LABELS[t]}
              </span>
            </button>
          ))}
        </div>

        {errors.type && (
          <p className="text-xs text-destructive mt-1">
            {errors.type}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Step 1
// ============================================================

function StepLocation({
  data,
  update,
  errors,
}: {
  data: WizardData;
  update: (
    u: Partial<WizardData>,
  ) => void;
  errors: Record<string, string>;
}) {
  const localities = data.city
    ? LOCALITIES[data.city] ?? []
    : [];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">
          City
        </Label>

        <select
          value={data.city ?? ""}
          onChange={(e) =>
            update({
              city:
                e.target.value ||
                undefined,
              locality: undefined,
            })
          }
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">
            Select city
          </option>

          {CITIES.map((c) => (
            <option
              key={c}
              value={c}
            >
              {c}
            </option>
          ))}
        </select>

        {errors.city && (
          <p className="text-xs text-destructive mt-1">
            {errors.city}
          </p>
        )}
      </div>

      <div>
        <Label className="text-sm font-semibold">
          Locality / Area
        </Label>

        <Input
          list="locality-suggestions"
          value={data.locality ?? ""}
          onChange={(e) =>
            update({
              locality:
                e.target.value ||
                undefined,
            })
          }
          placeholder={
            data.city
              ? "Type the locality or area name"
              : "Select a city first"
          }
          disabled={!data.city}
          className="mt-1.5"
        />

        <datalist id="locality-suggestions">
          {localities.map((l) => (
            <option
              key={l}
              value={l}
            />
          ))}
        </datalist>

        <p className="text-xs text-muted-foreground mt-1">
          Type any area name — common ones
          for {data.city ?? "your city"} are
          suggested as you type.
        </p>

        {errors.locality && (
          <p className="text-xs text-destructive mt-1">
            {errors.locality}
          </p>
        )}
      </div>

      <div>
        <Label className="text-sm font-semibold">
          Full address
        </Label>

        <Textarea
          value={data.address ?? ""}
          onChange={(e) =>
            update({
              address: e.target.value,
            })
          }
          placeholder="Street, building, landmark..."
          className="mt-1.5"
          rows={2}
        />

        {errors.address && (
          <p className="text-xs text-destructive mt-1">
            {errors.address}
          </p>
        )}
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-semibold">
          Pin the exact location
        </Label>

        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Click the map to drop a pin, drag it
          to fine-tune, or type the coordinates
          manually. Renters use this to judge
          the neighbourhood.
        </p>

        <LocationPicker
          city={data.city}
          value={{
            latitude: data.latitude,
            longitude: data.longitude,
          }}
          onChange={(loc) =>
            update({
              latitude: loc.latitude,
              longitude: loc.longitude,
            })
          }
        />

        {errors.location && (
          <p className="text-xs text-destructive mt-2">
            {errors.location}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Step 2
// ============================================================

function StepDetails({
  data,
  update,
  errors,
}: {
  data: WizardData;
  update: (
    u: Partial<WizardData>,
  ) => void;
  errors: Record<string, string>;
}) {
  const showBhk =
    data.type &&
    data.type !== "pg" &&
    data.type !== "commercial";

  const toggleAmenity = (
    amenity: string,
  ) => {
    update({
      amenities:
        data.amenities.includes(amenity)
          ? data.amenities.filter(
              (a) => a !== amenity,
            )
          : [
              ...data.amenities,
              amenity,
            ],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">
          Title
        </Label>

        <Input
          value={data.title ?? ""}
          onChange={(e) =>
            update({
              title: e.target.value,
            })
          }
          placeholder="e.g. Spacious 2 BHK near metro"
          className="mt-1.5"
        />

        {errors.title && (
          <p className="text-xs text-destructive mt-1">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <Label className="text-sm font-semibold">
          Description (optional)
        </Label>

        <Textarea
          value={data.description ?? ""}
          onChange={(e) =>
            update({
              description:
                e.target.value,
            })
          }
          placeholder="Describe the property, amenities nearby, etc."
          className="mt-1.5"
          rows={3}
        />
      </div>

      <div>
        <Label
          htmlFor="phoneNumber"
          className="text-sm font-semibold"
        >
          Contact Number *
        </Label>

        <Input
          id="phoneNumber"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={
            data.phoneNumber ?? ""
          }
          onChange={(e) =>
            update({
              phoneNumber:
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10),
            })
          }
          placeholder="Enter your 10-digit mobile number"
          maxLength={10}
          className="mt-1.5"
        />

        <p className="text-xs text-muted-foreground mt-1">
          This number will be used by interested
          tenants/buyers to contact you.
        </p>

        {errors.phoneNumber && (
          <p className="text-xs text-destructive mt-1">
            {errors.phoneNumber}
          </p>
        )}
      </div>

      {showBhk && (
        <div>
          <Label className="text-sm font-semibold">
            BHK
          </Label>

          <div className="mt-2 flex flex-wrap gap-2">
            {BHK_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() =>
                  update({
                    bhk:
                      data.bhk === b
                        ? undefined
                        : b,
                  })
                }
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                  data.bhk === b
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {b === 6
                  ? "6+"
                  : `${b}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">
            Area (sq.ft)
          </Label>

          <Input
            type="number"
            value={
              data.areaSqft ?? ""
            }
            onChange={(e) =>
              update({
                areaSqft: e.target
                  .value
                  ? Number(
                      e.target.value,
                    )
                  : undefined,
              })
            }
            placeholder="e.g. 1100"
            className="mt-1.5"
          />

          {errors.areaSqft && (
            <p className="text-xs text-destructive mt-1">
              {errors.areaSqft}
            </p>
          )}
        </div>

        <div>
          <Label className="text-sm font-semibold">
            Furnishing
          </Label>

          <select
            value={
              data.furnishing ?? ""
            }
            onChange={(e) =>
              update({
                furnishing:
                  (e.target.value ||
                    undefined) as
                    | (typeof FURNISHING)[number]
                    | undefined,
              })
            }
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">
              Select
            </option>

            {FURNISHING.map((f) => (
              <option
                key={f}
                value={f}
              >
                {FURNISHING_LABELS[f]}
              </option>
            ))}
          </select>

          {errors.furnishing && (
            <p className="text-xs text-destructive mt-1">
              {errors.furnishing}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">
            Floor
          </Label>

          <Input
            type="number"
            value={data.floor ?? ""}
            onChange={(e) =>
              update({
                floor: e.target
                  .value
                  ? Number(
                      e.target.value,
                    )
                  : undefined,
              })
            }
            placeholder="e.g. 4"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">
            Total floors
          </Label>

          <Input
            type="number"
            value={
              data.totalFloors ?? ""
            }
            onChange={(e) =>
              update({
                totalFloors:
                  e.target.value
                    ? Number(
                        e.target.value,
                      )
                    : undefined,
              })
            }
            placeholder="e.g. 10"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">
            Age (years)
          </Label>

          <Input
            type="number"
            value={
              data.ageOfProperty ?? ""
            }
            onChange={(e) =>
              update({
                ageOfProperty:
                  e.target.value
                    ? Number(
                        e.target.value,
                      )
                    : undefined,
              })
            }
            placeholder="e.g. 5"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">
            Available from
          </Label>

          <Input
            type="date"
            value={
              data.availableFrom ?? ""
            }
            onChange={(e) =>
              update({
                availableFrom:
                  e.target.value ||
                  undefined,
              })
            }
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">
          Amenities
        </Label>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {AMENITIES.map((a) => (
            <Badge
              key={a}
              variant={
                data.amenities.includes(
                  a,
                )
                  ? "default"
                  : "outline"
              }
              className={cn(
                "cursor-pointer text-xs",
                data.amenities.includes(
                  a,
                ) &&
                  "bg-primary text-primary-foreground",
              )}
              onClick={() =>
                toggleAmenity(a)
              }
            >
              {data.amenities.includes(
                a,
              ) && (
                <Check className="mr-1 h-3 w-3" />
              )}
              {a}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 3
// ============================================================

function StepPricing({
  data,
  update,
  errors,
}: {
  data: WizardData;
  update: (
    u: Partial<WizardData>,
  ) => void;
  errors: Record<string, string>;
}) {
  const isRent =
    data.listingFor === "rent";

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">
          {isRent
            ? "Monthly rent (₹)"
            : "Total price (₹)"}
        </Label>

        <Input
          type="number"
          value={data.price ?? ""}
          onChange={(e) =>
            update({
              price: e.target.value
                ? Number(
                    e.target.value,
                  )
                : undefined,
            })
          }
          placeholder={
            isRent
              ? "e.g. 25000"
              : "e.g. 8500000"
          }
          className="mt-1.5 text-lg font-semibold"
        />

        {data.price && (
          <p className="text-xs text-muted-foreground mt-1">
            {isRent
              ? "Per month: "
              : "Total: "}

            <span className="font-semibold text-foreground">
              {formatINR(
                data.price,
              )}
            </span>
          </p>
        )}

        {errors.price && (
          <p className="text-xs text-destructive mt-1">
            {errors.price}
          </p>
        )}
      </div>

      {isRent && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold">
              Deposit (₹)
            </Label>

            <Input
              type="number"
              value={
                data.deposit ?? ""
              }
              onChange={(e) =>
                update({
                  deposit:
                    e.target.value
                      ? Number(
                          e.target.value,
                        )
                      : undefined,
                })
              }
              placeholder="e.g. 200000"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">
              Maintenance (₹/mo)
            </Label>

            <Input
              type="number"
              value={
                data.maintenance ?? ""
              }
              onChange={(e) =>
                update({
                  maintenance:
                    e.target.value
                      ? Number(
                          e.target.value,
                        )
                      : undefined,
                })
              }
              placeholder="e.g. 3000"
              className="mt-1.5"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Switch
          checked={
            data.negotiable ?? false
          }
          onCheckedChange={(v) =>
            update({
              negotiable: v,
            })
          }
          id="negotiable"
        />

        <Label
          htmlFor="negotiable"
          className="text-sm cursor-pointer"
        >
          Price is negotiable
        </Label>
      </div>
    </div>
  );
}

// ============================================================
// Step 4
// ============================================================

function StepPhotos({
  data,
  update,
  onUpload,
  removePhoto,
  uploading,
  errors,
}: {
  data: WizardData;
  update: (
    u: Partial<WizardData>,
  ) => void;
  onUpload: (
    files: FileList | null,
  ) => Promise<void>;
  removePhoto: (
    index: number,
  ) => void;
  uploading: boolean;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">
        Photos
      </Label>

      <p className="text-xs text-muted-foreground">
        Upload at least 1 photo. JPEG, PNG
        or WebP, max 5 MB each.
      </p>

      {data.photos.length < 15 && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/50">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />

          <p className="text-sm font-medium text-foreground">
            {uploading
              ? "Uploading..."
              : "Click to upload photos"}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            or drag and drop
          </p>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) =>
              onUpload(
                e.target.files,
              )
            }
          />
        </label>
      )}

      {errors.photos && (
        <p className="text-xs text-destructive">
          {errors.photos}
        </p>
      )}

      {data.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {data.photos.map(
            (photo, i) => (
              <div
                key={photo}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
              >
                <PropertyImage
                  src={photo}
                  alt={`Photo ${
                    i + 1
                  }`}
                  className="h-full w-full"
                />

                <button
                  type="button"
                  onClick={() =>
                    removePhoto(i)
                  }
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          )}

          {uploading && (
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <div className="mt-2">
        <Label className="text-sm font-semibold">
          Video tour link (optional)
        </Label>

        <Input
          value={data.videoUrl ?? ""}
          onChange={(e) =>
            update({
              videoUrl:
                e.target.value,
            })
          }
          placeholder="YouTube / Vimeo URL"
          className="mt-1.5"
        />
      </div>
    </div>
  );
}

// ============================================================
// Step 5
// ============================================================

function StepReview({
  data,
  openStep,
}: {
  data: WizardData;
  openStep: (
    s: number,
  ) => void;
}) {
  const isRent =
    data.listingFor === "rent";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Purpose & Type
        </h3>

        <div className="flex gap-2 mt-1">
          <Badge>
            {data.listingFor
              ? PURPOSE_LABELS[
                  data.listingFor
                ]
              : "—"}
          </Badge>

          <Badge variant="secondary">
            {data.type
              ? PROPERTY_TYPE_LABELS[
                  data.type
                ]
              : "—"}
          </Badge>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Location
          </h3>

          <button
            type="button"
            onClick={() =>
              openStep(1)
            }
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>

        <p className="text-sm text-muted-foreground mt-1">
          {data.locality},{" "}
          {data.city}
        </p>

        <p className="text-xs text-muted-foreground">
          {data.address}
        </p>

        {data.latitude != null &&
          data.longitude != null && (
            <p className="text-xs text-primary mt-1">
              📍{" "}
              {data.latitude.toFixed(
                4,
              )}
              ,{" "}
              {data.longitude.toFixed(
                4,
              )}
            </p>
          )}
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Details
          </h3>

          <button
            type="button"
            onClick={() =>
              openStep(2)
            }
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>

        <p className="text-sm text-foreground mt-1">
          {data.title}
        </p>

        {data.phoneNumber && (
          <p className="text-sm text-muted-foreground mt-1">
            Contact:{" "}
            {data.phoneNumber}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {data.bhk && (
            <span>
              {data.bhk} BHK
            </span>
          )}

          <span>
            {data.areaSqft} sq.ft
          </span>

          <span>
            {data.furnishing
              ? FURNISHING_LABELS[
                  data.furnishing
                ]
              : "—"}
          </span>

          {data.floor !=
            null && (
            <span>
              Floor{" "}
              {data.floor}/
              {data.totalFloors ??
                "?"}
            </span>
          )}
        </div>

        {data.amenities.length >
          0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.amenities
              .slice(0, 6)
              .map((a) => (
                <Badge
                  key={a}
                  variant="outline"
                  className="text-[10px]"
                >
                  {a}
                </Badge>
              ))}

            {data.amenities.length >
              6 && (
              <span className="text-[10px] text-muted-foreground">
                +
                {data.amenities.length -
                  6}{" "}
                more
              </span>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Pricing
          </h3>

          <button
            type="button"
            onClick={() =>
              openStep(3)
            }
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>

        <div className="mt-1 space-y-1 text-sm">
          <p className="text-foreground font-semibold">
            {formatINR(
              data.price ?? 0,
            )}

            {isRent && (
              <span className="text-muted-foreground font-normal">
                {" "}
                / month
              </span>
            )}
          </p>

          {data.deposit !=
            null && (
            <p className="text-muted-foreground">
              Deposit:{" "}
              {formatINR(
                data.deposit,
              )}
            </p>
          )}

          {data.maintenance !=
            null && (
            <p className="text-muted-foreground">
              Maintenance:{" "}
              {formatINR(
                data.maintenance,
              )}
              /mo
            </p>
          )}

          <p className="text-muted-foreground">
            {data.negotiable
              ? "Negotiable"
              : "Fixed price"}
          </p>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Photos
          </h3>

          <button
            type="button"
            onClick={() =>
              openStep(4)
            }
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {data.photos.length}{" "}
          photo(s) uploaded
        </p>
      </div>

      <Separator />

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        <strong>Note:</strong>{" "}
        this listing will be submitted
        as "Pending review". An admin
        must approve it before it
        appears in public search
        results. You'll be able to track
        its status from your dashboard.
      </div>
    </div>
  );
}