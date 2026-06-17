"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary } from "@/components/ui/Button";

type ReadingProgress = {
  id: string;
  editionId: string;
  editionTitle: string;
  editionDate: string;
  editionType: string;
  coverImage?: string | null;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
};

export function ResumeReadingCard({ session }: { session: ReadingProgress }) {
  const progress = Math.round((session.currentPage / session.totalPages) * 100);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <Card className="relative overflow-hidden border-emerald-100 bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Cover Image */}
        <div className="shrink-0 w-24 md:w-32 aspect-[2/3] rounded-md overflow-hidden shadow-md bg-slate-200 dark:bg-slate-700">
          {session.coverImage ? (
            <img
              src={`/api/files/${session.coverImage}`}
              alt={session.editionTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              Pas d'image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                Reprendre la lecture
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Il y a {getTimeSince(session.lastReadAt)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">
              {session.editionTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Page {session.currentPage} sur {session.totalPages}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-right text-slate-500 dark:text-slate-400 font-medium">
              {progress}% lu
            </p>
          </div>

          {/* Action */}
          <div className="pt-2">
            <Link href={`/editions/${session.editionId}`}>
              <ButtonPrimary className="w-full md:w-auto">
                Continuer la lecture
              </ButtonPrimary>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function getTimeSince(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " ans";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " mois";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " jours";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " heures";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes";
  return Math.floor(seconds) + " secondes";
}
