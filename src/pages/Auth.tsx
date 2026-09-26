import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  UserX,
  Building2,
  Search,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<
    | "signIn"
    | { method: "email"; email: string }
    | { method: "phone"; phone: string }
    | "role"
  >("signIn");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After auth, check if user needs to pick a role
  // (useAuth user is loaded into this component via the parent)
  const setRole = useMutation(api.profile.setRole);
  const claimAdmin = useMutation(api.profile.claimAdmin);
  const setPhone = useMutation(api.profile.setPhone);
  const [shouldClaimAdmin, setShouldClaimAdmin] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const claimAttemptedRef = useRef(false);

  // Existing admins skip the role picker and go straight to the approval queue.
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // For the role check we use the user object. We can read it via a
      // Convex query from useAuth, but here we rely on the parent/useAuth
      // hook to update. We instead set step="role" and let the user choose.
      // The only purpose of this effect now is to show the role step
      // (triggered via handleOtpSubmit setting step="role").
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ method: "email", email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const countryCode = (formData.get("countryCode") as string) || "+91";
      const digits = ((formData.get("phone") as string) || "").replace(
        /\D/g,
        "",
      );
      if (digits.length < 7 || digits.length > 15) {
        throw new Error("Enter a valid phone number");
      }
      const phone = `${countryCode}${digits}`;
      const payload = new FormData();
      payload.set("phone", phone);
      await signIn("phone-otp", payload);
      setStep({ method: "phone", phone });
      setIsLoading(false);
    } catch (error) {
      console.error("Phone sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const provider =
        typeof step === "object" && step.method === "phone"
          ? "phone-otp"
          : "email-otp";
      await signIn(provider, formData);
      setIsLoading(false);

      // Wait for the Convex auth state to become available before trying
      // to claim admin access. Calling claimAdmin() immediately after
      // signIn() can race with the auth session being established.
      if (typeof step === "object" && step.method === "phone") {
        setVerifiedPhone(step.phone);
      } else {
        setVerifiedPhone(null);
      }
      setShouldClaimAdmin(true);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  useEffect(() => {
    if (
      !shouldClaimAdmin ||
      authLoading ||
      !isAuthenticated ||
      !user ||
      claimAttemptedRef.current
    ) {
      return;
    }

    claimAttemptedRef.current = true;

    const claim = async () => {
      try {
        await claimAdmin();
        navigate("/admin");
        return;
      } catch {
        // Not an admin — continue with the normal role-selection flow.
        if (verifiedPhone) {
          try {
            await setPhone({ phone: verifiedPhone });
          } catch (err) {
            console.error("Failed to save phone number:", err);
          }
        }
        setShouldClaimAdmin(false);
        setStep("role");
      }
    };

    void claim();
  }, [
    shouldClaimAdmin,
    authLoading,
    isAuthenticated,
    user,
    claimAdmin,
    navigate,
    verifiedPhone,
    setPhone,
  ]);

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      setIsLoading(false);
      setStep("role");
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to sign in as guest",
      );
      setIsLoading(false);
    }
  };

  const handleRoleSelect = async (role: "owner" | "tenant") => {
    setIsLoading(true);
    try {
      await setRole({ role });
      navigate(redirect);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set role",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
          <Card className="min-w-[350px] pb-0 border shadow-md">
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center">
                  <div className="flex justify-center">
                    <img
  src={`${import.meta.env.BASE_URL}logo.png`}
  alt="EstateDirect Logo"
  width={64}
  height={64}
  className="rounded-lg mb-4 mt-4 cursor-pointer object-contain"
  onClick={() => navigate("/")}
/>
                   
                  </div>  
                  <CardTitle className="text-xl">Get Started</CardTitle>
                  <CardDescription>
                    {method === "phone"
                      ? "Enter your phone number to log in or sign up"
                      : "Enter your email to log in or sign up"}
                  </CardDescription>
                </CardHeader>

                {/* Email / Phone method tabs */}
                <div className="px-6">
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setMethod("email")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        method === "email"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("phone")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        method === "phone"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Phone className="h-4 w-4" />
                      Phone
                    </button>
                  </div>
                </div>

                {method === "email" ? (
                  <form onSubmit={handleEmailSubmit}>
                    <CardContent className="pt-4">
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            className="pl-9"
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          size="icon"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-destructive">
                          {error}
                        </p>
                      )}
                    </CardContent>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneSubmit}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <select
                          name="countryCode"
                          defaultValue="+91"
                          className="h-9 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
                          aria-label="Country code"
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+65">🇸🇬 +65</option>
                        </select>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            placeholder="98765 43210"
                            className="pl-9"
                            disabled={isLoading}
                            required
                            pattern="[0-9]{7,15}"
                            title="Enter a valid phone number"
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          size="icon"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-destructive">
                          {error}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        We'll text you a 6-digit verification code. Standard
                        SMS rates may apply.
                      </p>
                    </CardContent>
                  </form>
                )}

                <CardContent className="pt-0">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Continue as Guest
                  </Button>
                </CardContent>
              </>
            ) : typeof step === "object" ? (
              <>
                <CardHeader className="text-center mt-4">
                  <CardTitle>
                    {step.method === "phone"
                      ? "Check your phone"
                      : "Check your email"}
                  </CardTitle>
                  <CardDescription>
                    {step.method === "phone"
                      ? `We've sent a 6-digit code to ${step.phone}`
                      : `We've sent a code to ${step.email}`}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    {step.method === "phone" ? (
                      <input
                        type="hidden"
                        name="phone"
                        value={step.phone}
                      />
                    ) : (
                      <input
                        type="hidden"
                        name="email"
                        value={step.email}
                      />
                    )}
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            otp.length === 6 &&
                            !isLoading
                          ) {
                            const form = (
                              e.target as HTMLElement
                            ).closest("form");
                            if (form) form.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-destructive text-center">
                        {error}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Didn't receive a code?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setStep("signIn")}
                      >
                        Try again
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify code
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("signIn")}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {step.method === "phone"
                        ? "Use different number"
                        : "Use different email"}
                    </Button>
                  </CardFooter>
                </form>
              </>
            ) : (
              /* Role selection step */
              <>
                <CardHeader className="text-center mt-4">
                  <CardTitle className="text-xl">You're in!</CardTitle>
                  <CardDescription>
                    Choose how you'd like to use EstateDirect
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 space-y-3">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("tenant")}
                    disabled={isLoading}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition-all",
                      "border-border/50 hover:border-primary/50 hover:bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Search className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          I'm looking to rent or buy
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Search properties, contact owners, and find your
                          next home
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("owner")}
                    disabled={isLoading}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition-all",
                      "border-border/50 hover:border-primary/50 hover:bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          I want to list a property
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Post your property, reach renters directly, and
                          save on brokerage
                        </p>
                      </div>
                    </div>
                  </button>
                  {error && (
                    <p className="text-xs text-destructive text-center">
                      {error}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex-col">
                  {isLoading && (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                </CardFooter>
              </>
            )}

            
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}