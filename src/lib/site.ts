/** Public, non-secret site configuration (safe for client bundles). */
export const site = {
  name: "VELORA",
  tagline: "Drive Beyond Ordinary.",
  description:
    "VELORA is a premium automotive marketplace. Discover, compare, buy and rent exceptional vehicles from verified listings with transparent pricing.",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2349034824292",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "concierge@velora.example",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+234 903 482 4292",
  address: "14 Admiralty Way, Lekki Phase 1, Lagos",
  hours: "Mon – Sat, 9:00 – 19:00",
  currency: "NGN",
  locale: "en-NG",
  social: {
    instagram: "https://instagram.com",
    x: "https://x.com",
    youtube: "https://youtube.com",
    linkedin: "https://linkedin.com",
  },
  /** Commercial rules shared by UI and server (server always recomputes). */
  commerce: {
    depositRate: 0.1,
    fullPaymentLimit: 75_000_000,
    orderHoldMinutes: 30,
    deliveryFee: 0,
  },
  rental: {
    minDays: 1,
    maxDays: 90,
    cancellationHours: 48,
    locations: [
      "VELORA Lekki Showroom, Lagos",
      "Murtala Muhammed Airport (LOS), Lagos",
      "Victoria Island, Lagos",
      "Wuse II, Abuja",
      "Nnamdi Azikiwe Airport (ABV), Abuja",
      "GRA, Port Harcourt",
    ],
    extras: [
      { code: "CHAUFFEUR", label: "Professional chauffeur", description: "Vetted, uniformed driver for the full rental", pricing: "PER_DAY", amount: 45_000 },
      { code: "INSURANCE_PLUS", label: "Premium cover", description: "Reduces your excess liability to zero", pricing: "PER_DAY", amount: 25_000 },
      { code: "DELIVERY", label: "Door-step delivery & collection", description: "We bring the car to you and collect it", pricing: "FLAT", amount: 35_000 },
      { code: "CHILD_SEAT", label: "Child safety seat", description: "ISOFIX seat fitted before handover", pricing: "FLAT", amount: 15_000 },
      { code: "SECURITY_ESCORT", label: "Security escort", description: "Armed escort vehicle (Lagos & Abuja only)", pricing: "PER_DAY", amount: 120_000 },
    ],
  },
} as const;

export type RentalExtraCode = (typeof site.rental.extras)[number]["code"];
