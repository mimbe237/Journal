"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  /** Hide this column on mobile card view */
  hideOnMobile?: boolean;
  /** Use as primary info in mobile card */
  primary?: boolean;
  /** Use as secondary info in mobile card */
  secondary?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  /** Actions column render (shown as buttons in mobile card) */
  actions?: (item: T) => ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  className?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  actions,
  emptyMessage = "Aucune donnée",
  loading,
  className,
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const primaryColumn = columns.find((c) => c.primary);
  const secondaryColumn = columns.find((c) => c.secondary);
  const mobileColumns = columns.filter((c) => !c.hideOnMobile && !c.primary && !c.secondary);

  return (
    <div className={clsx("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-slate-700"
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-600">
                    {col.render(item)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {actions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
          >
            {/* Primary & Secondary info */}
            <div className="mb-3">
              {primaryColumn && (
                <div className="font-semibold text-slate-900">
                  {primaryColumn.render(item)}
                </div>
              )}
              {secondaryColumn && (
                <div className="text-sm text-slate-500">
                  {secondaryColumn.render(item)}
                </div>
              )}
            </div>

            {/* Other columns as key-value pairs */}
            <div className="space-y-2 text-sm">
              {mobileColumns.map((col) => (
                <div key={col.key} className="flex justify-between">
                  <span className="text-slate-500">{col.header}</span>
                  <span className="text-slate-900 font-medium text-right">
                    {col.render(item)}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            {actions && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {actions(item)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
