export interface CalcInput {
  point: number; // jarak antar entry (pips)
  lot: number; // lot awal
  multiplier: number; // 1 = flat, >1 = martingale
  entries: number; // jumlah entry
  kurs: number; // USD -> IDR
}

export interface EntryRow {
  index: number;
  lot: number;
  distancePips: number;
  lossCent: number;
  cumLossCent: number;
}

export interface CalcResult {
  rows: EntryRow[];
  totalCent: number;
  totalUsd: number;
  totalRp: number;
  worstLot: number;
}

/** Lot entry ke-i, dibulatkan 2 desimal seperti di jurnal. */
export function lotAt(lot: number, multiplier: number, index: number): number {
  const raw = lot * Math.pow(multiplier, index - 1);
  return Math.round(raw * 100) / 100;
}

/** Jarak floating entry ke-i dari titik terjauh (pips). */
export function distanceAt(point: number, entries: number, index: number): number {
  return (entries + 1 - index) * point;
}

/** Floating loss satu entry dalam CENT (10 cent per pip per 1.0 lot). */
export function lossCentAt(lot: number, distancePips: number): number {
  return lot * distancePips * 10;
}

export function computeKetahanan(input: CalcInput): CalcResult {
  const rows: EntryRow[] = [];
  let cum = 0;
  for (let i = 1; i <= input.entries; i++) {
    const lot = lotAt(input.lot, input.multiplier, i);
    const distancePips = distanceAt(input.point, input.entries, i);
    const lossCent = lossCentAt(lot, distancePips);
    cum += lossCent;
    rows.push({ index: i, lot, distancePips, lossCent, cumLossCent: cum });
  }
  const totalCent = cum;
  const totalUsd = totalCent / 100;
  const totalRp = totalUsd * input.kurs;
  return {
    rows,
    totalCent,
    totalUsd,
    totalRp,
    worstLot: rows.length ? rows[rows.length - 1].lot : 0,
  };
}

const idNum = (minFrac = 0, maxFrac = 2) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  });

export const fmtCent = (v: number) => idNum(0, 0).format(Math.round(v));
export const fmtUsd = (v: number) => idNum(2, 2).format(v);
export const fmtRp = (v: number) => idNum(0, 0).format(Math.round(v));
export const fmtPct = (v: number) => `${idNum(1, 2).format(v)}%`;
export const fmtLot = (v: number) => idNum(2, 2).format(v);

/** Parse angka dengan format Indonesia: "0,1" atau "1.000,5" atau plain "100". */
export function parseIdNumber(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, "");
  if (!cleaned) return NaN;
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}
