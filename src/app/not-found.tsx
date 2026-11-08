import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-midnight px-6 text-center text-white">
      <div>
        <Link href="/" aria-label="VELORA home"><LogoMark className="mx-auto size-10" /></Link>
        <p className="eyebrow mt-10">Error 404</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl">Wrong turn.</h1>
        <p className="mx-auto mt-4 max-w-md text-white/60">The page you're looking for has moved, sold, or never existed. Let's get you back on the road.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><LinkButton href="/cars">Explore vehicles</LinkButton><LinkButton href="/" variant="outline-light">Back home</LinkButton></div>
      </div>
    </main>
  );
}
