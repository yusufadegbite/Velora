import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "outline" | "outline-light" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-semibold tracking-wide whitespace-nowrap rounded-[2px] transition-all duration-300 ease-[var(--ease-premium)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none";
const variants: Record<Variant, string> = {
  primary: "bg-gold text-midnight hover:bg-gold-light shadow-[0_8px_24px_-12px_rgba(196,154,90,0.8)]",
  dark: "bg-midnight text-white hover:bg-midnight-700",
  outline: "border border-midnight/20 text-midnight hover:border-midnight hover:bg-midnight hover:text-white",
  "outline-light": "border border-white/25 text-white hover:border-gold hover:text-gold",
  ghost: "text-midnight hover:bg-midnight/5",
  danger: "bg-danger text-white hover:bg-danger/90",
  link: "text-midnight underline-offset-4 hover:underline px-0",
};
const sizes: Record<Size, string> = { sm: "h-9 px-4 text-xs", md: "h-11 px-6 text-sm", lg: "h-[52px] px-8 text-sm" };

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(base, variants[variant], variant !== "link" && sizes[size], className);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant, size, className, ...props }, ref) {
  return <button ref={ref} className={buttonClass(variant, size, className)} {...props} />;
});

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };
export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
