import clsx from "clsx";
import type { InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes } from "react";

export function Label({ children, htmlFor }: PropsWithChildren<{ htmlFor?: string }>) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm",
        "placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200",
        props.className
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm",
        "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200",
        props.className
      )}
    />
  );
}
