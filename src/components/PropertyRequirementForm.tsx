import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Search, Send } from "lucide-react";

export default function PropertyRequirementForm() {
  const createRequirement = useMutation(
    api.propertyRequirements.create,
  );

  const [listingFor, setListingFor] = useState<
    "rent" | "buy" | "sale"
  >("rent");

  const [propertyType, setPropertyType] = useState<
    "flat" | "house" | "pg" | "villa" | "commercial"
  >("flat");

  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [areaSqFt, setAreaSqFt] = useState("");
  const [bhk, setBhk] = useState("");

  const [furnishing, setFurnishing] = useState<
    "furnished" | "semi_furnished" | "unfurnished" | ""
  >("");

  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim()) {
      toast.error("Please enter your preferred location.");
      return;
    }

    if (!budget || Number(budget) <= 0) {
      toast.error("Please enter a valid budget.");
      return;
    }

    if (!phone.trim()) {
      toast.error("Please enter your contact number.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      toast.error("Please enter a valid 10-digit contact number.");
      return;
    }

    setSubmitting(true);

    try {
      await createRequirement({
        listingFor,
        propertyType,
        location: location.trim(),
        budget: Number(budget),
        areaSqFt: areaSqFt
          ? Number(areaSqFt)
          : undefined,
        bhk: bhk ? Number(bhk) : undefined,
        furnishing: furnishing || undefined,
        phone: phone.trim(),
        message: message.trim() || undefined,
      });

      toast.success(
        "Your property requirement has been submitted.",
      );

      setLocation("");
      setBudget("");
      setAreaSqFt("");
      setBhk("");
      setFurnishing("");
      setPhone("");
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit your requirement.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>

          <div>
            <CardTitle>
              Tell us what you're looking for
            </CardTitle>

            <CardDescription>
              Submit your property requirement and our team will
              contact you.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Looking For + Property Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-2">
              <Label>Looking for</Label>

              <Select
                value={listingFor}
                onValueChange={(value) =>
                  setListingFor(
                    value as "rent" | "buy" | "sale",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select requirement" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="rent">
                    Rent
                  </SelectItem>

                  <SelectItem value="buy">
                    Buy
                  </SelectItem>

                  <SelectItem value="sale">
                    Sale
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Property type</Label>

              <Select
                value={propertyType}
                onValueChange={(value) =>
                  setPropertyType(
                    value as
                      | "flat"
                      | "house"
                      | "pg"
                      | "villa"
                      | "commercial",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="flat">
                    Flat / Apartment
                  </SelectItem>

                  <SelectItem value="house">
                    Independent House
                  </SelectItem>

                  <SelectItem value="pg">
                    PG / Hostel
                  </SelectItem>

                  <SelectItem value="villa">
                    Villa
                  </SelectItem>

                  <SelectItem value="commercial">
                    Commercial
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location + Budget */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="requirement-location">
                Preferred location
              </Label>

              <Input
                id="requirement-location"
                placeholder="e.g. Dwarka, Noida, Bangalore..."
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirement-budget">
                {listingFor === "rent"
                  ? "Monthly budget (₹)"
                  : listingFor === "buy"
                    ? "Maximum budget (₹)"
                    : "Expected price (₹)"}
              </Label>

              <Input
                id="requirement-budget"
                type="number"
                min="0"
                placeholder={
                  listingFor === "rent"
                    ? "e.g. 25000"
                    : listingFor === "buy"
                      ? "e.g. 5000000"
                      : "e.g. 5000000"
                }
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value)
                }
              />
            </div>
          </div>

          {/* Required Area */}
          <div className="space-y-2">
            <Label htmlFor="requirement-area">
              Required area (sq ft)
            </Label>

            <Input
              id="requirement-area"
              type="number"
              min="0"
              placeholder="e.g. 1200"
              value={areaSqFt}
              onChange={(e) =>
                setAreaSqFt(e.target.value)
              }
            />
          </div>

          {/* BHK + Furnishing */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="requirement-bhk">
                BHK
              </Label>

              <Select
                value={bhk}
                onValueChange={setBhk}
              >
                <SelectTrigger id="requirement-bhk">
                  <SelectValue placeholder="Select BHK" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="1">
                    1 BHK
                  </SelectItem>

                  <SelectItem value="2">
                    2 BHK
                  </SelectItem>

                  <SelectItem value="3">
                    3 BHK
                  </SelectItem>

                  <SelectItem value="4">
                    4 BHK
                  </SelectItem>

                  <SelectItem value="5">
                    5+ BHK
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Furnishing</Label>

              <Select
                value={furnishing}
                onValueChange={(value) =>
                  setFurnishing(
                    value as
                      | "furnished"
                      | "semi_furnished"
                      | "unfurnished",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select furnishing" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="furnished">
                    Furnished
                  </SelectItem>

                  <SelectItem value="semi_furnished">
                    Semi Furnished
                  </SelectItem>

                  <SelectItem value="unfurnished">
                    Unfurnished
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="requirement-phone">
              Contact number
            </Label>

            <Input
              id="requirement-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10),
                )
              }
            />
          </div>

          {/* Additional requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirement-message">
              Additional requirements
            </Label>

            <Textarea
              id="requirement-message"
              placeholder="Anything else you need? Parking, metro connectivity, preferred floor, etc."
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              rows={4}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={submitting}
          >
            <Send className="h-4 w-4" />

            {submitting
              ? "Submitting..."
              : "Submit Requirement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}