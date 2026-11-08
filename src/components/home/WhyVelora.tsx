import { BadgeCheck, Receipt, LockKeyhole, CalendarRange, Headset } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { VehicleImage } from "@/components/ui/VehicleImage";

const POINTS = [
  { Icon: BadgeCheck, title: "Verified vehicle listings", text: "Every car passes a 180-point inspection. Customs papers, title and service history are verified before listing." },
  { Icon: Receipt, title: "Transparent pricing", text: "The price you see is the price you pay — duties, registration and plates itemised up front. No surprises." },
  { Icon: LockKeyhole, title: "Secure transactions", text: "Payments run through Paystack with server-side verification. Reservation deposits are fully receipted." },
  { Icon: CalendarRange, title: "Flexible rental options", text: "Daily, weekly or monthly hire, with chauffeur, delivery and premium cover available on every booking." },
  { Icon: Headset, title: "Dedicated customer support", text: "A named advisor from first enquiry to handover — reachable by phone, email or WhatsApp, six days a week." },
];

export function WhyVelora({ image }: { image: string | null }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
      <Reveal className="relative hidden min-h-[520px] overflow-hidden bg-midnight lg:block">
        <VehicleImage src={image} alt="VELORA showroom" fill sizes="45vw" className="opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent" />
        <div className="absolute right-8 bottom-8 left-8 text-white">
          <p className="eyebrow">The VELORA Standard</p>
          <p className="mt-3 text-2xl leading-snug font-semibold tracking-tight">“We sell fewer cars than most dealers. Every one of them is a car we'd buy ourselves.”</p>
          <p className="mt-4 text-sm text-white/55">— Head of Acquisitions</p>
        </div>
      </Reveal>
      <div>
        <Reveal>
          <p className="eyebrow">Why choose VELORA</p>
          <h2 className="display mt-3 text-3xl sm:text-[2.6rem]">Buying a car this special should feel this simple.</h2>
        </Reveal>
        <Stagger className="mt-10 divide-y divide-line border-y border-line">
          {POINTS.map(({ Icon, title, text }) => (
            <StaggerItem key={title} className="group flex gap-5 py-6">
              <span className="grid size-11 shrink-0 place-items-center border border-line bg-white text-gold transition-colors duration-500 group-hover:border-midnight group-hover:bg-midnight"><Icon className="size-5" aria-hidden /></span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
