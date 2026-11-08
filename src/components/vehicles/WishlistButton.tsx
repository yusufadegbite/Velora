"use client";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleWishlist } from "@/actions/engagement";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export function WishlistButton({ vehicleId, saved, variant = "icon", className }: { vehicleId: string; saved: boolean; variant?: "icon" | "full"; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      setOptimistic(!optimistic);
      const res = await toggleWishlist(vehicleId);
      if (res.requiresLogin) {
        toast("Sign in to save vehicles to your wishlist", "info");
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.message) toast(res.message, res.ok ? "success" : "error");
      router.refresh();
    });
  };
  const label = optimistic ? "Remove from wishlist" : "Add to wishlist";
  if (variant === "full")
    return (
      <button type="button" onClick={onClick} disabled={pending} aria-pressed={optimistic} className={cn("inline-flex h-11 items-center justify-center gap-2 border px-5 text-sm font-semibold transition", optimistic ? "border-gold bg-gold/10 text-gold-dark" : "border-midnight/20 hover:border-midnight", className)}>
        <Heart className={cn("size-4", optimistic && "fill-gold text-gold")} />
        {optimistic ? "Saved" : "Add to Wishlist"}
      </button>
    );
  return (
    <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={onClick} disabled={pending} aria-pressed={optimistic} aria-label={label} title={label}
      className={cn("grid size-9 place-items-center rounded-full bg-white/90 text-midnight shadow-sm backdrop-blur transition hover:bg-white", className)}>
      <Heart className={cn("size-4 transition", optimistic && "fill-gold text-gold")} />
    </motion.button>
  );
}
