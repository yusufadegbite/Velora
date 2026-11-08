"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, ShoppingBag, CalendarRange, Heart, GitCompareArrows, Bell, UserRound, ShieldCheck, Car, Tags, Users, Megaphone, Inbox, BarChart3, LogOut, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/ui/Logo";

const CUSTOMER = [
  { href: "/dashboard", label: "Overview", Icon: LayoutGrid },
  { href: "/dashboard/orders", label: "My Orders", Icon: ShoppingBag },
  { href: "/dashboard/rentals", label: "My Rentals", Icon: CalendarRange },
  { href: "/dashboard/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/dashboard/comparisons", label: "Saved Comparisons", Icon: GitCompareArrows },
  { href: "/dashboard/notifications", label: "Notifications", Icon: Bell, badge: "unread" },
  { href: "/dashboard/profile", label: "Profile Settings", Icon: UserRound },
  { href: "/dashboard/security", label: "Account Security", Icon: ShieldCheck },
];
const ADMIN = [
  { href: "/admin", label: "Overview", Icon: BarChart3 },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Car },
  { href: "/admin/brands", label: "Brands", Icon: Tags },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { href: "/admin/rentals", label: "Rentals", Icon: CalendarRange },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/enquiries", label: "Enquiries", Icon: Inbox, badge: "unread" },
  { href: "/admin/content", label: "Content", Icon: Megaphone },
];

export function DashboardSidebar({ variant, unread = 0, user }: { variant: "customer" | "admin"; unread?: number; user: { name: string; email: string } }) {
  const pathname = usePathname();
  const items = variant === "admin" ? ADMIN : CUSTOMER;
  const root = variant === "admin" ? "/admin" : "/dashboard";
  const active = (href: string) => (href === root ? pathname === root : pathname.startsWith(href));
  const dark = variant === "admin";
  return (
    <>
      <aside className={cn("hidden w-64 shrink-0 lg:block", dark ? "bg-midnight text-white" : "")}>
        <div className={cn("sticky flex flex-col", dark ? "top-0 h-screen p-5" : "top-24")}>
          {dark && <div className="mb-8 px-2 pt-2"><Logo /><p className="mt-2 text-[0.65rem] tracking-[0.25em] text-gold uppercase">Admin console</p></div>}
          {!dark && (
            <div className="mb-6 border-b border-line pb-6">
              <div className="grid size-12 place-items-center rounded-full bg-midnight text-sm font-bold text-gold">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
              <p className="mt-3 font-semibold">{user.name}</p>
              <p className="truncate text-xs text-slate">{user.email}</p>
            </div>
          )}
          <nav aria-label={dark ? "Admin" : "Account"} className="flex-1">
            <ul className="space-y-0.5">
              {items.map(({ href, label, Icon, badge }) => (
                <li key={href}>
                  <Link href={href} aria-current={active(href) ? "page" : undefined}
                    className={cn("relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors", dark ? (active(href) ? "text-white" : "text-white/55 hover:text-white") : (active(href) ? "font-semibold text-midnight" : "text-slate hover:text-midnight"))}>
                    {active(href) && <motion.span layoutId={`${variant}-side`} className={cn("absolute inset-0 -z-0", dark ? "bg-white/[0.07]" : "bg-white shadow-sm")} transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                    {active(href) && <span className="absolute inset-y-2 left-0 w-0.5 bg-gold" />}
                    <Icon className="relative size-4" aria-hidden />
                    <span className="relative flex-1">{label}</span>
                    {badge && unread > 0 && <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[0.65rem] font-bold text-midnight">{unread}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={cn("mt-6 space-y-1 border-t pt-4", dark ? "border-white/10" : "border-line")}>
            {dark && <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-white/55 hover:text-white"><ExternalLink className="size-4" />View site</Link>}
            {dark && <p className="truncate px-3 text-xs text-white/35">{user.email}</p>}
            <form action={logoutAction}><button className={cn("flex w-full items-center gap-3 px-3 py-2 text-sm", dark ? "text-white/55 hover:text-white" : "text-slate hover:text-midnight")}><LogOut className="size-4" />Sign out</button></form>
          </div>
        </div>
      </aside>
      {/* Mobile: horizontal scrolling tabs */}
      <nav aria-label={dark ? "Admin" : "Account"} className={cn("no-scrollbar -mx-4 overflow-x-auto px-4 lg:hidden", dark && "sticky top-0 z-30 bg-midnight py-2")}>
        <ul className="flex gap-1.5">
          {items.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex items-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap", active(href) ? "bg-gold text-midnight" : dark ? "bg-white/5 text-white/70" : "border border-line bg-white text-slate")}>
                <Icon className="size-3.5" />{label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
