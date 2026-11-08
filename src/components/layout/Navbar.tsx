"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, User, X, LayoutDashboard, LogOut, Shield, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/cars", label: "Explore Cars" },
  { href: "/rentals", label: "Rentals" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

type NavUser = { name: string; role: "ADMIN" | "CUSTOMER"; unread: number } | null;

export function Navbar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState("");
  const overHero = pathname === "/" || pathname === "/about" || pathname === "/rentals";
  const solid = scrolled || !overHero || menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); setAccountOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuOpen(false); setSearchOpen(false); setAccountOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/cars${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
    setSearchOpen(false);
  };
  const iconBtn = "relative grid size-10 place-items-center text-white/80 transition hover:text-gold";

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", solid ? "bg-midnight/95 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md" : "bg-transparent")}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-2 focus:text-midnight">Skip to content</a>
        <div className={cn("container-x flex items-center justify-between transition-all duration-500", solid ? "h-16" : "h-20")}>
          <Logo />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={cn("relative px-3.5 py-2 text-[0.82rem] font-medium tracking-wide transition-colors", isActive(n.href) ? "text-white" : "text-white/65 hover:text-white")}>
                    {n.label}
                    {isActive(n.href) && <motion.span layoutId="nav-indicator" className="absolute inset-x-3.5 -bottom-0.5 h-px bg-gold" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-0.5">
            <button className={iconBtn} aria-label="Search vehicles" onClick={() => setSearchOpen(true)}><Search className="size-[18px]" /></button>
            <Link href="/dashboard/wishlist" className={cn(iconBtn, "hidden sm:grid")} aria-label="Wishlist"><Heart className="size-[18px]" /></Link>
            <div className="relative hidden sm:block">
              {user ? (
                <button className={iconBtn} aria-label="Account menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((o) => !o)}>
                  <span className="grid size-8 place-items-center rounded-full bg-gold text-xs font-bold text-midnight">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                  {user.unread > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-gold ring-2 ring-midnight" aria-label={`${user.unread} unread notifications`} />}
                </button>
              ) : (
                <Link href="/login" className={iconBtn} aria-label="Sign in"><User className="size-[18px]" /></Link>
              )}
              <AnimatePresence>
                {accountOpen && user && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-60 bg-white py-2 text-midnight shadow-2xl">
                    <p className="border-b border-line px-4 pt-1 pb-3 text-sm"><span className="block text-xs text-slate">Signed in as</span><span className="font-semibold">{user.name}</span></p>
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-ivory"><LayoutDashboard className="size-4 text-slate" />My dashboard</Link>
                    {user.role === "ADMIN" && <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-ivory"><Shield className="size-4 text-slate" />Admin console</Link>}
                    <form action={logoutAction}><button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-ivory"><LogOut className="size-4 text-slate" />Sign out</button></form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="/cars" className={buttonClass("primary", "sm", "ml-3 hidden md:inline-flex")}>Find Your Car</Link>
            <button className={cn(iconBtn, "lg:hidden")} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div id="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-40 bg-midnight pt-16 lg:hidden">
            <nav aria-label="Mobile" className="container-x flex h-full flex-col overflow-y-auto pb-10">
              <ul className="mt-6 border-t border-white/10">
                {NAV.map((n, i) => (
                  <motion.li key={n.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05, ease: [0.22, 1, 0.36, 1] }} className="border-b border-white/10">
                    <Link href={n.href} className={cn("flex items-center justify-between py-4 text-2xl font-semibold tracking-tight", isActive(n.href) ? "text-gold" : "text-white")}>
                      {n.label}<ArrowRight className="size-5 text-white/30" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 grid grid-cols-2 gap-3">
                <Link href="/dashboard/wishlist" className={buttonClass("outline-light", "md")}><Heart className="size-4" />Wishlist</Link>
                {user ? <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className={buttonClass("outline-light", "md")}><User className="size-4" />Account</Link> : <Link href="/login" className={buttonClass("outline-light", "md")}><User className="size-4" />Sign in</Link>}
                <Link href="/cars" className={buttonClass("primary", "lg", "col-span-2")}>Find Your Car</Link>
                {user && <form action={logoutAction} className="col-span-2"><button className="w-full py-3 text-sm text-white/50">Sign out</button></form>}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-midnight/97 backdrop-blur" role="dialog" aria-modal="true" aria-label="Search vehicles">
            <div className="container-x pt-24">
              <button onClick={() => setSearchOpen(false)} className="absolute top-5 right-5 p-2 text-white/60 hover:text-white" aria-label="Close search"><X className="size-6" /></button>
              <p className="eyebrow">Search the collection</p>
              <form onSubmit={submitSearch} className="mt-5 flex items-center gap-4 border-b border-white/20 pb-4 focus-within:border-gold">
                <Search className="size-7 text-white/40" aria-hidden />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “G 63”, “Porsche 2024”, “electric SUV”…" aria-label="Search query" className="w-full bg-transparent text-2xl font-medium text-white placeholder:text-white/25 focus:outline-none sm:text-4xl" />
              </form>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Mercedes-Benz", "Range Rover", "Porsche 911", "Land Cruiser", "Tesla", "Lamborghini Urus"].map((s) => (
                  <Link key={s} href={`/cars?q=${encodeURIComponent(s)}`} className="border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-gold hover:text-gold">{s}</Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
