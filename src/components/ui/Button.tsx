import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

// Boutons réutilisables avec une palette cohérente.
export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants: Record<typeof variant, string> = {
    primary:
      "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 focus-visible:outline-emerald-400 shadow-sm shadow-emerald-900/20",
    secondary:
      "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-emerald-400",
    ghost: "text-slate-100 hover:text-white",
    danger: "bg-red-500 text-white hover:bg-red-600 focus-visible:outline-red-400 shadow-sm"
  };

  return (
    <button className={clsx(base, variants[variant], "px-4 py-2", className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonPrimary(props: ButtonProps) {
  return <Button variant="primary" {...props} />;
}

export function ButtonSecondary(props: ButtonProps) {
  return <Button variant="secondary" {...props} />;
}
