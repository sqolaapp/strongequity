export interface CalcInput {
  point: number; // jarak antar entry (pips)
  lot: number; // lot awal
  multiplier: number; // 1 = flat, >1 = martingale
  entries: number; // jumlah entry
  kurs: number; // USD -> IDR
  pipValueCent: number; // nilai 1 pip untuk 1,00 lot (dalam cent). Default 100¢ = $1
  modalUsd: number; // equity yang Anda punya
  bufferPct: number; // buffer keamanan tambahan (%)
}

export interface EntryRow {
  index: number;
  lot: number;
  distancePips: number;
  lossCent: number;
  cumLossCent: number;
  cumLot: number;
  /** Sisa equity (USD) jika harga sampai di titik terjauh dan entry ini sudah terbuka. */
  equityLeftUsd: number;
  /** True jika akumulasi floating loss sampai entry ini sudah melebihi modal. */
  blown: boolean;
}

export interface CalcResult {
  rows: EntryRow[];
  totalCent: number;
  totalUsd: number;
  totalRp: number;
  worstLot: number;
  totalLot: number;
  totalDistancePips: number;
  /** Persen floating loss terhadap modal. */
  riskPct: number;
  /** Sisa equity setelah floating loss maksimum. */
  equityLeftUsd: number;
  /** Modal minimum yang disarankan (total loss + buffer). */
  requiredUsd: number;
  requiredRp: number;
  /** Entry pertama yang membuat modal habis (null kalau bertahan semua). */
  blownAtEntry: number | null;
  /** Berapa entry yang masih tertahan modal saat ini. */
  survivedEntries: number;
  /** Jarak pips maksimum yang bisa ditahan modal saat ini pada entry pertama saja. */
  maxDistanceFirstEntryPips: number;
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

/** Floating loss satu entry dalam CENT. */
export function lossCentAt(lot: number, distancePips: number, pipValueCent: number): number {
  return lot * distancePips * pipValueCent;
}

export function computeKetahanan(input: CalcInput): CalcResult {
  const pipValueCent = input.pipValueCent > 0 ? input.pipValueCent : 100;
  const modalCent = Math.max(0, input.modalUsd) * 100;
  const rows: EntryRow[] = [];
  let cum = 0;
  let cumLot = 0;
  let blownAtEntry: number | null = null;

  for (let i = 1; i <= input.entries; i++) {
    const lot = lotAt(input.lot, input.multiplier, i);
    const distancePips = distanceAt(input.point, input.entries, i);
    const lossCent = lossCentAt(lot, distancePips, pipValueCent);
    cum += lossCent;
    cumLot = Math.round((cumLot + lot) * 100) / 100;
    const blown = modalCent > 0 && cum > modalCent;
    if (blown && blownAtEntry === null) blownAtEntry = i;
    rows.push({
      index: i,
      lot,
      distancePips,
      lossCent,
      cumLossCent: cum,
      cumLot,
      equityLeftUsd: (modalCent - cum) / 100,
      blown,
    });
  }

  const totalCent = cum;
  const totalUsd = totalCent / 100;
  const requiredUsd = totalUsd * (1 + Math.max(0, input.bufferPct) / 100);
  const firstLot = lotAt(input.lot, input.multiplier, 1);

  return {
    rows,
    totalCent,
    totalUsd,
    totalRp: totalUsd * input.kurs,
    worstLot: rows.length ? (rows.at(-1)?.lot ?? 0) : 0,
    totalLot: cumLot,
    totalDistancePips: input.entries * input.point,
    riskPct: input.modalUsd > 0 ? (totalUsd / input.modalUsd) * 100 : 0,
    equityLeftUsd: input.modalUsd - totalUsd,
    requiredUsd,
    requiredRp: requiredUsd * input.kurs,
    blownAtEntry,
    survivedEntries: blownAtEntry === null ? input.entries : blownAtEntry - 1,
    maxDistanceFirstEntryPips:
      firstLot > 0 && pipValueCent > 0 ? modalCent / (firstLot * pipValueCent) : 0,
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
export const fmtPips = (v: number) => idNum(0, 0).format(Math.round(v));

/** Parse angka dengan format Indonesia: "0,1" atau "1.000,5" atau plain "100". */
export function parseIdNumber(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, "");
  if (!cleaned) return NaN;
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export const DEFAULT_INPUT: CalcInput = {
  point: 100,
  lot: 0.1,
  multiplier: 1,
  entries: 20,
  kurs: 16500,
  pipValueCent: 100,
  modalUsd: 3000,
  bufferPct: 20,
};
