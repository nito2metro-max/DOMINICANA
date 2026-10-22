import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] whitespace-nowrap";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  outline: "border border-line-strong bg-white text-ink hover:border-ink-2/40 hover:bg-canvas",
  ghost: "text-ink-2 hover:bg-canvas hover:text-ink",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  accent: "bg-sun-500 text-white shadow-sm hover:bg-sun-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type BtnProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };
export function Button({ variant, size, className, type = "button", ...rest }: BtnProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...rest} />;
}

type LinkBtnProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; children: ReactNode };
export function LinkButton({ variant, size, className, ...rest }: LinkBtnProps) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}
