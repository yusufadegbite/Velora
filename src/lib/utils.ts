import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFmt = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const compactFmt = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });
const numberFmt = new Intl.NumberFormat("en-NG");

export const formatPrice = (n: number) => currencyFmt.format(n);
export const formatCompactPrice = (n: number) => `₦${compactFmt.format(n)}`;
export const formatNumber = (n: number) => numberFmt.format(n);
export const formatMileage = (km: number) => (km === 0 ? "0 km" : `${numberFmt.format(km)} km`);

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-NG", opts).format(new Date(d));
}
export function formatDateTime(d: Date | string) {
  return formatDate(d, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const titleCase = (s: string) =>
  s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const LABELS = {
  condition: { NEW: "Brand New", CERTIFIED_PRE_OWNED: "Certified Pre-Owned", FOREIGN_USED: "Foreign Used", LOCAL_USED: "Nigerian Used" },
  bodyType: { SEDAN: "Sedan", SUV: "SUV", COUPE: "Coupé", CONVERTIBLE: "Convertible", HATCHBACK: "Hatchback", PICKUP: "Pickup", WAGON: "Wagon", MINIVAN: "Minivan" },
  fuelType: { PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid", PLUG_IN_HYBRID: "Plug-in Hybrid", ELECTRIC: "Electric" },
  transmission: { AUTOMATIC: "Automatic", MANUAL: "Manual" },
  drivetrain: { FWD: "Front-wheel drive", RWD: "Rear-wheel drive", AWD: "All-wheel drive", FOUR_WD: "4×4" },
  vehicleStatus: { AVAILABLE: "Available", RESERVED: "Reserved", SOLD: "Sold", ARCHIVED: "Archived" },
  orderStatus: {
    PENDING: "Pending", AWAITING_PAYMENT: "Awaiting Payment", PAYMENT_CONFIRMED: "Payment Confirmed",
    PROCESSING: "Processing", COMPLETED: "Completed", CANCELLED: "Cancelled",
  },
  paymentOption: { FULL_PAYMENT: "Full payment", RESERVATION_DEPOSIT: "Reservation deposit", ENQUIRY: "Purchase enquiry" },
  rentalStatus: { PENDING: "Pending approval", CONFIRMED: "Confirmed", ACTIVE: "Active", COMPLETED: "Completed", CANCELLED: "Cancelled", REJECTED: "Rejected" },
  paymentStatus: { PENDING: "Pending", SUCCESS: "Successful", FAILED: "Failed", ABANDONED: "Abandoned", REFUNDED: "Refunded" },
  enquiryStatus: { NEW: "New", IN_PROGRESS: "In progress", RESOLVED: "Resolved" },
} as const;

export function label<K extends keyof typeof LABELS>(group: K, key: string): string {
  return (LABELS[group] as Record<string, string>)[key] ?? titleCase(key);
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function randomCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
