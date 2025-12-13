"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type RevenueData = {
  month: string;
  fullDate: string;
  revenue: number;
  count: number;
};

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/revenue")
      .then(res => res.json())
      .then(json => {
        if (json.data) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Chargement...</div>;
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">Aucune donnée</div>;

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1000); // Avoid div by zero

  return (
    <div className="w-full space-y-4">
      <div className="flex items-end justify-between h-64 gap-2 pt-6 pb-2">
        {data.map((item) => {
          const heightPercent = (item.revenue / maxRevenue) * 100;
          return (
            <div key={item.fullDate} className="flex flex-col items-center justify-end h-full flex-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {item.revenue.toLocaleString()} XOF ({item.count} abos)
              </div>
              
              {/* Bar */}
              <div 
                className="w-full max-w-[40px] bg-emerald-500 rounded-t hover:bg-emerald-600 transition-all duration-300 relative"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              >
              </div>
              
              {/* Label */}
              <div className="mt-2 text-xs text-slate-500 font-medium uppercase">{item.month}</div>
            </div>
          );
        })}
      </div>
      <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-2">
        Revenus mensuels (XOF) - Année en cours
      </div>
    </div>
  );
}
