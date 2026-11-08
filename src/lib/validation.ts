import { z } from "zod";

const trimmed = (min: number, max: number, msg?: string) => z.string().trim().min(min, msg).max(max);
export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(160);
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number");
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    name: trimmed(2, 80, "Enter your full name"),
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password").max(128) });
export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z
  .object({ token: z.string().min(20).max(100), password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const profileSchema = z.object({ name: trimmed(2, 80, "Enter your full name"), phone: phoneSchema.optional().or(z.literal("")) });
export const changePasswordSchema = z
  .object({ currentPassword: z.string().max(128), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

// ─── Catalogue filters (URL search params) ──────────────────────────────
const enumList = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? [] : (Array.isArray(v) ? v : v.split(",")).filter((x): x is T[number] => (values as readonly string[]).includes(x))));
const optInt = z.coerce.number().int().nonnegative().optional().catch(undefined);
const optNum = z.coerce.number().nonnegative().optional().catch(undefined);

export const BODY_TYPES = ["SEDAN", "SUV", "COUPE", "CONVERTIBLE", "HATCHBACK", "PICKUP", "WAGON", "MINIVAN"] as const;
export const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "PLUG_IN_HYBRID", "ELECTRIC"] as const;
export const TRANSMISSIONS = ["AUTOMATIC", "MANUAL"] as const;
export const CONDITIONS = ["NEW", "CERTIFIED_PRE_OWNED", "FOREIGN_USED", "LOCAL_USED"] as const;
export const DRIVETRAINS = ["FWD", "RWD", "AWD", "FOUR_WD"] as const;
export const SORTS = ["newest", "price_asc", "price_desc", "popular", "recent", "year_desc", "mileage_asc"] as const;

export const vehicleFilterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  brand: z.union([z.string(), z.array(z.string())]).optional().transform((v) => (v === undefined ? [] : (Array.isArray(v) ? v : v.split(",")).filter((s) => /^[a-z0-9-]{1,60}$/.test(s)))),
  model: z.string().trim().max(60).optional().catch(undefined),
  minPrice: optNum,
  maxPrice: optNum,
  minYear: optInt,
  maxYear: optInt,
  maxMileage: optInt,
  minEngine: optNum,
  maxEngine: optNum,
  body: enumList(BODY_TYPES),
  fuel: enumList(FUEL_TYPES),
  transmission: enumList(TRANSMISSIONS),
  condition: enumList(CONDITIONS),
  availability: z.enum(["available", "all"]).optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});
export type VehicleFilters = z.infer<typeof vehicleFilterSchema>;

// ─── Forms ───────────────────────────────────────────────────────────────
export const enquirySchema = z.object({
  name: trimmed(2, 80, "Enter your name"),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  subject: trimmed(3, 140, "Add a short subject"),
  message: trimmed(10, 3000, "Tell us a little more (10+ characters)"),
  type: z.enum(["GENERAL", "VEHICLE_INFO", "TEST_DRIVE", "FINANCING", "RENTAL"]).default("GENERAL"),
  vehicleId: z.string().cuid().optional().or(z.literal("")),
});

export const newsletterSchema = z.object({ email: emailSchema });

export const checkoutSchema = z
  .object({
    vehicleId: z.string().cuid(),
    paymentOption: z.enum(["FULL_PAYMENT", "RESERVATION_DEPOSIT", "ENQUIRY"]),
    customerName: trimmed(2, 80, "Enter your full name"),
    email: emailSchema,
    phone: phoneSchema,
    fulfilment: z.enum(["DELIVERY", "COLLECTION"]),
    deliveryAddress: z.string().trim().max(240).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    state: z.string().trim().max(80).optional().or(z.literal("")),
    billingName: trimmed(2, 120, "Enter the billing name"),
    billingAddress: trimmed(5, 240, "Enter the billing address"),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    acceptTerms: z.literal("on", { message: "Please accept the purchase terms" }),
  })
  .superRefine((d, ctx) => {
    if (d.fulfilment === "DELIVERY") {
      if (!d.deliveryAddress || d.deliveryAddress.length < 5) ctx.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Enter a delivery address" });
      if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter a city" });
      if (!d.state) ctx.addIssue({ code: "custom", path: ["state"], message: "Enter a state" });
    }
  });

export const rentalBookingSchema = z.object({
  vehicleId: z.string().cuid(),
  pickupLocation: trimmed(3, 120, "Choose a pickup location"),
  returnLocation: trimmed(3, 120, "Choose a return location"),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a pickup date"),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a return date"),
  pickupTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a pickup time"),
  extras: z.array(z.string().max(40)).max(10).default([]),
  customerName: trimmed(2, 80, "Enter the driver's full name"),
  email: emailSchema,
  phone: phoneSchema,
  driverLicense: trimmed(5, 40, "Enter a valid licence number"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  acceptTerms: z.literal("on", { message: "Please accept the rental terms" }),
});

export const reviewSchema = z.object({
  vehicleId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: trimmed(3, 100, "Add a title"),
  body: trimmed(10, 2000, "Write at least 10 characters"),
});

// ─── Admin ───────────────────────────────────────────────────────────────
const money = z.coerce.number().positive("Must be greater than zero").max(1e13);
const optMoney = z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().positive().max(1e12).optional());

export const vehicleSchema = z
  .object({
    brandId: z.string().cuid("Choose a brand"),
    model: trimmed(1, 60, "Enter the model"),
    trim: z.string().trim().max(60).optional().or(z.literal("")),
    year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
    price: money,
    previousPrice: optMoney,
    mileage: z.coerce.number().int().min(0).max(2_000_000),
    transmission: z.enum(TRANSMISSIONS),
    fuelType: z.enum(FUEL_TYPES),
    bodyType: z.enum(BODY_TYPES),
    drivetrain: z.enum(DRIVETRAINS),
    condition: z.enum(CONDITIONS),
    status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "ARCHIVED"]),
    engine: trimmed(2, 80, "Describe the engine"),
    engineCapacity: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().min(0).max(12).optional()),
    horsepower: z.coerce.number().int().min(30).max(2500),
    seats: z.coerce.number().int().min(1).max(20),
    exteriorColor: trimmed(2, 40, "Enter the exterior colour"),
    interiorColor: trimmed(2, 40, "Enter the interior colour"),
    location: trimmed(2, 60, "Enter the location"),
    vin: z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN must be 17 characters").optional().or(z.literal("")),
    description: trimmed(30, 5000, "Description should be at least 30 characters"),
    featured: z.boolean(),
    forSale: z.boolean(),
    forRent: z.boolean(),
    dailyRate: optMoney,
    weeklyRate: optMoney,
    monthlyRate: optMoney,
    securityDeposit: optMoney,
    imageUrls: z.array(z.string().url().max(500)).max(20),
    specs: z.array(z.object({ group: trimmed(1, 40), label: trimmed(1, 60), value: trimmed(1, 120) })).max(60),
  })
  .superRefine((d, ctx) => {
    if (d.forRent && !d.dailyRate) ctx.addIssue({ code: "custom", path: ["dailyRate"], message: "Rental vehicles need a daily rate" });
    if (!d.forRent && !d.forSale) ctx.addIssue({ code: "custom", path: ["forSale"], message: "List the vehicle for sale, rent or both" });
  });

export const brandSchema = z.object({
  name: trimmed(2, 60, "Enter the brand name"),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  heroImage: z.string().url().max(500).optional().or(z.literal("")),
});

/** Flatten Zod errors into { field: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> } | undefined;
