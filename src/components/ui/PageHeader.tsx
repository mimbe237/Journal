import type { PropsWithChildren, ReactNode } from "react";
import clsx from "clsx";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, description, actions, className, children }: PropsWithChildren<PageHeaderProps>) {
  return (
    <div className={clsx("flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6", className)}>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
