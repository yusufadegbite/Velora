"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

const FLOWS = {
  buy: [
    ["Discover", "Filter 30+ verified vehicles by brand, price, year and specification, or compare up to four side by side."],
    ["Reserve", "Secure your car online with a 10% reservation deposit through Paystack — or send a no-obligation enquiry."],
    ["Inspect & finalise", "View and test-drive at our showroom. Your advisor handles documentation, financing and the balance."],
    ["Drive away", "Collect at a private handover, or have the car delivered — registered, insured and fully detailed."],
  ],
  rent: [
    ["Choose your car", "Browse the rental fleet with daily, weekly and monthly rates shown up front."],
    ["Pick your dates", "Live availability prevents double-booking. Add chauffeur, delivery or premium cover in a click."],
    ["Get confirmed", "Our concierge confirms your booking, then you pay securely online. Track everything in your dashboard."],
    ["Enjoy the drive", "Collect from any VELORA location or have it delivered. Free cancellation up to 48 hours before pickup."],
  ],
} as const;

export function HowItWorks() {
  const [tab, setTab] = useState<keyof typeof FLOWS>("buy");
  return (
    <div>
      <div role="tablist" aria-label="How it works" className="inline-flex border border-white/15 p-1">
        {(["buy", "rent"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("relative px-6 py-2.5 text-sm font-semibold transition-colors", tab === t ? "text-midnight" : "text-white/60 hover:text-white")}>
            {tab === t && <motion.span layoutId="how-tab" className="absolute inset-0 bg-gold" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <span className="relative">{t === "buy" ? "Buying" : "Renting"}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.ol key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {FLOWS[tab].map(([title, text], i) => (
            <li key={title} className="bg-midnight p-7">
              <span className="font-mono text-sm text-gold">0{i + 1}</span>
              <h3 className="mt-8 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{text}</p>
            </li>
          ))}
        </motion.ol>
      </AnimatePresence>
    </div>
  );
}
