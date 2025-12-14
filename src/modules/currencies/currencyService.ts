import { prisma } from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";

export const DEFAULT_CURRENCY = "XAF";

export type CurrencyConfig = {
  code: string;
  name: string;
  rateToXaf: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function listCurrencies(): Promise<CurrencyConfig[]> {
  const currencies = await prisma.currency.findMany({
    orderBy: { code: "asc" }
  });

  return currencies.map((c) => ({
    code: c.code,
    name: c.name,
    rateToXaf: Number(c.rateToXaf),
    isActive: c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }));
}

export async function createCurrency(input: {
  code: string;
  name: string;
  rateToXaf: number;
  isActive?: boolean;
}): Promise<CurrencyConfig> {
  const currency = await prisma.currency.create({
    data: {
      code: input.code.toUpperCase(),
      name: input.name,
      rateToXaf: new Prisma.Decimal(input.rateToXaf),
      isActive: input.isActive ?? true
    }
  });

  return {
    code: currency.code,
    name: currency.name,
    rateToXaf: Number(currency.rateToXaf),
    isActive: currency.isActive,
    createdAt: currency.createdAt,
    updatedAt: currency.updatedAt
  };
}

export async function updateCurrency(
  code: string,
  input: { name?: string; rateToXaf?: number; isActive?: boolean }
): Promise<CurrencyConfig> {
  const data: Prisma.CurrencyUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.rateToXaf !== undefined) data.rateToXaf = new Prisma.Decimal(input.rateToXaf);
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const currency = await prisma.currency.update({
    where: { code: code.toUpperCase() },
    data
  });

  return {
    code: currency.code,
    name: currency.name,
    rateToXaf: Number(currency.rateToXaf),
    isActive: currency.isActive,
    createdAt: currency.createdAt,
    updatedAt: currency.updatedAt
  };
}

export async function getCurrencyByCode(code: string): Promise<CurrencyConfig | null> {
  const currency = await prisma.currency.findUnique({ where: { code: code.toUpperCase() } });
  if (!currency) return null;
  return {
    code: currency.code,
    name: currency.name,
    rateToXaf: Number(currency.rateToXaf),
    isActive: currency.isActive,
    createdAt: currency.createdAt,
    updatedAt: currency.updatedAt
  };
}

export function convertFromXaf(amount: number, rate: number) {
  return Number((amount / rate).toFixed(2));
}
*** End of file