export type PeriodPreset = "this_month" | "last_month" | "last_7_days" | "last_30_days" | "custom";

export function resolvePreset(preset: PeriodPreset | undefined, startDate?: string, endDate?: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (preset) {
    case "this_month":
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      break;
    case "last_month":
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0); // last day of previous month
      break;
    case "last_7_days":
      start.setDate(start.getDate() - 7);
      break;
    case "last_30_days":
      start.setDate(start.getDate() - 30);
      break;
    default:
      return { startDate, endDate };
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
