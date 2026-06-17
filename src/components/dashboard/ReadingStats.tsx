"use client";

import { Card } from "@/components/ui/Card";

type StatsProps = {
  totalBooksRead: number;
  totalPagesRead: number;
  readingStreak: number; // Jours consécutifs
};

export function ReadingStats({ totalBooksRead, totalPagesRead, readingStreak }: StatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="text-center p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {totalBooksRead}
        </div>
        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
          Éditions lues
        </div>
      </Card>
      <Card className="text-center p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
          {totalPagesRead}
        </div>
        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
          Pages tournées
        </div>
      </Card>
      <Card className="text-center p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="text-2xl md:text-3xl font-bold text-amber-500 dark:text-amber-400">
          {readingStreak}
        </div>
        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
          Jours de suite
        </div>
      </Card>
    </div>
  );
}
