import { Logo } from "@/components/ui/Logo";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { prisma } from "@/lib/db";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const img = await prisma.vehicleImage.findFirst({ where: { vehicle: { featured: true, bodyType: "COUPE" } }, select: { url: true } });
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-midnight lg:block">
        <VehicleImage src={img?.url ?? null} alt="" fill sizes="50vw" className="opacity-60" bare priority />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-midnight/60" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo />
          <div>
            <p className="eyebrow">Drive Beyond Ordinary.</p>
            <p className="display mt-4 max-w-md text-4xl">Your garage, wishlist and bookings — in one place.</p>
          </div>
        </div>
      </aside>
      <main id="main" className="flex flex-col px-5 py-8 sm:px-12">
        <div className="lg:hidden"><Logo light={false} /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
