export interface CalcInput {
  point: number; // jarak antar entry (pips)
  lot: number; // lot awal
  multiplier: number; // 1 = flat, >1 = martingale
  entries: number; // jumlah entry
  /** Berapa entry yang berakhir loss (floating). Sisanya profit saat harga berbalik. */
  lossEntries: number;
  /** BUY: loss dari atas ke bawah, profit dari bawah ke atas. SELL: kebalikannya. */
  direction: "buy" | "sell";
  kurs: number; // USD -> IDR
  pipValueCent: number; // nilai 1 pip untuk 1,00 lot (dalam cent). Default 100¢ = $1
  modalUsd: number; // equity yang Anda punya
  bufferPct: number; // buffer keamanan tambahan (%)
}

export interface EntryRow {
  index: number;
  lot: number;
  distancePips: number;
  /** P/L entry ini dalam CENT: negatif = loss, 0 = BEP, positif = profit. */
  plCent: number;
  /** Akumulasi P/L bersih sampai entry ini (cent). Negatif = floating loss. */
  cumPlCent: number;
  cumLot: number;
  /** loss = floating, bep = pas di titik balik (0), profit = sudah hijau. */
  status: "loss" | "bep" | "profit";
  /** Sisa equity (USD) pada titik akumulasi entry ini. */
  equityLeftUsd: number;
  /** True jika akumulasi floating loss sampai entry ini sudah melebihi modal. */
  blown: boolean;
}

export interface CalcResult {
  rows: EntryRow[];
  /** P/L bersih total (cent). Negatif = loss, positif = profit. */
  totalCent: number;
  totalUsd: number;
  totalRp: number;
  /** Total floating loss (cent, nilai positif) dari entry-entry loss. */
  totalLossCent: number;
  /** Total profit (cent) dari entry-entry profit. */
  totalProfitCent: number;
  /** Floating loss maksimum (cent) sebelum entry profit mulai menutup. */
  peakLossCent: number;
  lossEntries: number;
  profitEntries: number;
  worstLot: number;
  totalLot: number;
  totalDistancePips: number;
  /** Persen floating loss maksimum terhadap modal. */
  riskPct: number;
  /** Sisa equity setelah floating loss maksimum. */
  equityLeftUsd: number;
  /** Modal minimum yang disarankan (floating loss maksimum + buffer). */
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
  const lossEntries = Math.max(0, Math.min(input.entries, Math.round(input.lossEntries)));
  const rows: EntryRow[] = [];
  let cum = 0; // akumulasi loss (positif)
  let profit = 0; // akumulasi profit (positif)
  let cumLot = 0;
  let blownAtEntry: number | null = null;

  // Selalu ada TEPAT 1 entry BEP (nol) di titik balik, di antara loss dan profit.
  const profitEntries = Math.max(0, input.entries - lossEntries - 1);
  for (let i = 1; i <= input.entries; i++) {
    const lot = lotAt(input.lot, input.multiplier, i);
    // BUY: loss di atas (1..L), BEP di L+1, profit dari bawah ke atas.
    // SELL: dibalik — profit di atas (1..P), BEP di P+1, loss di bawah.
    const status: EntryRow["status"] =
      input.direction === "buy"
        ? i <= lossEntries
          ? "loss"
          : i === lossEntries + 1
            ? "bep"
            : "profit"
        : i <= profitEntries
          ? "profit"
          : i === profitEntries + 1
            ? "bep"
            : "loss";
    // Entry loss: floating sesuai jarak ke titik terjauh.
    // Entry profit: makin jauh dari titik balik (BEP) makin besar profitnya (1, 2, 3, ... grid).
    const profitGrid =
      input.direction === "buy" ? i - lossEntries - 1 : profitEntries + 1 - i;
    const distancePips =
      status === "profit"
        ? profitGrid * input.point
        : status === "bep"
          ? 0
          : distanceAt(input.point, input.entries, i);
    const plCent =
      status === "profit"
        ? lossCentAt(lot, distancePips, pipValueCent)
        : status === "bep"
          ? 0
          : -lossCentAt(lot, distancePips, pipValueCent);
    if (status === "profit") profit += plCent;
    else if (status === "loss") cum += -plCent;
    const netCent = profit - cum;
    cumLot = Math.round((cumLot + lot) * 100) / 100;
    const blown = modalCent > 0 && cum > modalCent;
    if (blown && blownAtEntry === null) blownAtEntry = i;
    rows.push({
      index: i,
      lot,
      distancePips,
      plCent,
      cumPlCent: netCent,
      cumLot,
      status,
      equityLeftUsd: (modalCent + netCent) / 100,
      blown,
    });
  }

  const peakLossCent = cum; // loss menumpuk dulu sebelum profit masuk
  const netCent = profit - cum;
  const totalUsd = netCent / 100;
  const peakUsd = peakLossCent / 100;
  const requiredUsd = peakUsd * (1 + Math.max(0, input.bufferPct) / 100);
  const firstLot = lotAt(input.lot, input.multiplier, 1);

  return {
    rows,
    totalCent: netCent,
    totalUsd,
    totalRp: totalUsd * input.kurs,
    totalLossCent: cum,
    totalProfitCent: profit,
    peakLossCent,
    lossEntries,
    profitEntries,
    worstLot: rows.length ? (rows.at(-1)?.lot ?? 0) : 0,
    totalLot: cumLot,
    totalDistancePips: input.entries * input.point,
    riskPct: input.modalUsd > 0 ? (peakUsd / input.modalUsd) * 100 : 0,
    equityLeftUsd: input.modalUsd - peakUsd,
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
  lossEntries: 20,
  direction: "buy",
  kurs: 17653,
  pipValueCent: 100,
  modalUsd: 3000,
  bufferPct: 20,
};
