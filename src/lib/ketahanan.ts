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
  /** Harga entry ke-1. Dipakai untuk kolom harga & pending order. */
  startPrice: number;
  /** Nilai 1 point dalam satuan harga. Default 1 → jarak 100 point = 4000,00 ke 3900,00. */
  pointSize: number;
  /** Berapa entry per tingkat jarak. 1 = jarak seragam (perilaku dasar). */
  gridGroup: number;
  /** Pengali jarak antar tingkat. 1 = jarak seragam. */
  gridStep: number;
  /** add = 100, 200, 300 (bertambah). multiply = 100, 200, 400 (berlipat). */
  gridMode: "add" | "multiply";
  /**
   * Jarak khusus yang ditulis manual, menimpa pola. Key = nomor langkah grid
   * (langkah ke-i = jarak dari entry ke-i ke level berikutnya). Kosong = ikut pola.
   */
  gapOverrides: Record<string, number>;
}

export interface EntryRow {
  index: number;
  lot: number;
  /** Harga pasang entry ini (untuk pending order). */
  price: number;
  /** Jarak (point) dari entry ini ke level berikutnya. Baris terakhir = ke titik terjauh. */
  gapPoints: number;
  /** True kalau jarak baris ini ditulis manual (bukan dari pola). */
  gapManual: boolean;
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
  /** P/L bersih setelah profit dikurangi loss (USD). */
  netProfitUsd: number;
  /** Persen pertumbuhan net profit terhadap modal. */
  netProfitPct: number;
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

/**
 * Jarak (point) langkah grid ke-k. Dengan gridStep = 1 semua langkah sama besar
 * (grid seragam). Contoh grup 2, step 2, point 100:
 *   add      → 100, 100, 200, 200, 300, 300 …
 *   multiply → 100, 100, 200, 200, 400, 400 …
 */
export function gridGapAt(input: CalcInput, k: number): number {
  const manual = input.gapOverrides?.[String(k)];
  if (typeof manual === "number" && manual > 0) return manual;
  const group = Math.max(1, Math.round(input.gridGroup || 1));
  const step = input.gridStep > 0 ? input.gridStep : 1;
  const tier = Math.floor(Math.max(0, k - 1) / group);
  const factor = input.gridMode === "multiply" ? Math.pow(step, tier) : 1 + tier * (step - 1);
  return input.point * Math.max(0, factor);
}

/**
 * Jarak kumulatif (point) dari harga awal setelah k langkah grid.
 * levels[0] = 0, levels[k] = posisi harga setelah k langkah.
 * Entry ke-i dipasang di levels[i-1]; titik terjauh ada di levels[entries].
 */
export function buildLevels(input: CalcInput, steps: number): number[] {
  const levels: number[] = [0];
  for (let k = 1; k <= steps; k++) levels.push((levels[k - 1] ?? 0) + gridGapAt(input, k));
  return levels;
}

/** Jarak entry ke-i dari entry ke-1, dalam point. */
export function gridPointsFromFirst(input: CalcInput, index: number): number {
  const i = Math.max(1, Math.round(index));
  return buildLevels(input, i - 1)[i - 1] ?? 0;
}

/** Ubah jarak (point) jadi selisih harga. */
export function pointsToPrice(input: CalcInput, points: number): number {
  const size = input.pointSize > 0 ? input.pointSize : 1;
  return points * size;
}

/**
 * Harga pada jarak tertentu (point) dari harga awal.
 * BUY: harga bergerak turun saat melawan; SELL: naik.
 */
export function priceAtPoints(input: CalcInput, points: number): number {
  if (!(input.startPrice > 0)) return 0;
  const offset = pointsToPrice(input, points);
  return input.direction === "buy" ? input.startPrice - offset : input.startPrice + offset;
}

/** Harga pasang entry ke-i. Mengembalikan 0 kalau harga awal belum diisi. */
export function priceAt(input: CalcInput, index: number): number {
  return priceAtPoints(input, gridPointsFromFirst(input, index));
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
  // Floating loss saat fase buka: SEMUA entry yang sudah terbuka ikut merugi.
  // Tiap grid tambahan, seluruh lot terbuka rugi 1 grid → naik point × pipValue × totalLot.
  let floatingCent = 0;
  let peakFloatingCent = 0;

  // Selalu ada TEPAT 1 entry BEP (nol) di titik balik, di antara loss dan profit.
  const profitEntries = Math.max(0, input.entries - lossEntries - 1);
  // Peta jarak kumulatif: entry ke-i dipasang di levels[i-1], harga berhenti
  // di levels[lossEntries] setelah berbalik. Mendukung grid tidak seragam.
  const levels = buildLevels(input, input.entries);
  const reversalLevel = levels[lossEntries] ?? 0;
  for (let i = 1; i <= input.entries; i++) {
    const lot = lotAt(input.lot, input.multiplier, i);
    // BUY dan SELL simetris: yang berbeda hanya arah harga (turun vs naik).
    // Entry ke-1 selalu paling jauh dari titik balik, jadi paling akhir pulih;
    // entry terakhir (dibuka di titik terjauh) yang lebih dulu jadi profit.
    const status: EntryRow["status"] =
      i <= lossEntries ? "loss" : i === lossEntries + 1 ? "bep" : "profit";
    // Jarak entry ini ke harga akhir (titik balik), dalam point.
    const entryLevel = levels[i - 1] ?? 0;
    const distancePips = Math.abs(entryLevel - reversalLevel);
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
    floatingCent += ((levels[i] ?? 0) - (levels[i - 1] ?? 0)) * pipValueCent * cumLot;
    if (floatingCent > peakFloatingCent) peakFloatingCent = floatingCent;
    const blown = modalCent > 0 && floatingCent > modalCent;
    if (blown && blownAtEntry === null) blownAtEntry = i;
    rows.push({
      index: i,
      lot,
      price: priceAt(input, i),
      gapPoints: (levels[i] ?? 0) - (levels[i - 1] ?? 0),
      gapManual: typeof input.gapOverrides?.[String(i)] === "number",
      distancePips,
      plCent,
      cumPlCent: netCent,
      cumLot,
      status,
      equityLeftUsd: (modalCent + netCent) / 100,
      blown,
    });
  }

  // Modal harus menahan titik TERBURUK (semua entry terbuka di titik terjauh),
  // bukan cuma entry yang berakhir loss setelah harga berbalik.
  const peakLossCent = peakFloatingCent;
  const netCent = profit - cum;
  const totalUsd = netCent / 100;
  const peakUsd = peakLossCent / 100;
  const requiredUsd = peakUsd * (1 + Math.max(0, input.bufferPct) / 100);
  const firstLot = lotAt(input.lot, input.multiplier, 1);
  const netProfitUsd = totalUsd;
  const netProfitPct = input.modalUsd > 0 ? (netProfitUsd / input.modalUsd) * 100 : 0;

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
    totalDistancePips: levels[input.entries] ?? 0,
    riskPct: input.modalUsd > 0 ? (peakUsd / input.modalUsd) * 100 : 0,
    equityLeftUsd: input.modalUsd - peakUsd,
    requiredUsd,
    requiredRp: requiredUsd * input.kurs,
    blownAtEntry,
    survivedEntries: blownAtEntry === null ? input.entries : blownAtEntry - 1,
    maxDistanceFirstEntryPips: firstLot > 0 && pipValueCent > 0 ? modalCent / (firstLot * pipValueCent) : 0,
    netProfitUsd,
    netProfitPct,
  };
}

const idNum = (minFrac = 0, maxFrac = 2) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  });

export const fmtCent = (v: number) => idNum(0, 0).format(Math.round(v));
export const fmtUsd = (v: number) => idNum(0, 0).format(Math.round(v));
export const fmtRp = (v: number) => idNum(0, 0).format(Math.round(v));
export const fmtPct = (v: number) => `${idNum(0, 0).format(Math.round(v))}%`;
export const fmtLot = (v: number) => idNum(2, 2).format(v);
export const fmtPrice = (v: number) => idNum(2, 2).format(v);
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
  modalUsd: 10000,
  bufferPct: 20,
  startPrice: 4000,
  pointSize: 1,
  gridGroup: 1,
  gridStep: 1,
  gridMode: "add",
  gapOverrides: {},
};

export type Currency = "cent" | "usd" | "idr";

export const CURRENCY_LABEL: Record<Currency, string> = {
  cent: "Cent (¢)",
  usd: "USD ($)",
  idr: "Rupiah (Rp)",
};

/** Format nilai cent ke mata uang pilihan, tanpa tanda. */
export function fmtMoney(cent: number, currency: Currency, kurs: number): string {
  const abs = Math.abs(cent);
  if (currency === "cent") return `${fmtCent(abs)}¢`;
  if (currency === "usd") return `$${fmtUsd(abs / 100)}`;
  return `Rp${fmtRp((abs / 100) * kurs)}`;
}

/** Format nilai USD ke mata uang pilihan, dengan tanda minus bila negatif. */
export function fmtMoneySigned(cent: number, currency: Currency, kurs: number): string {
  return `${cent < 0 ? "-" : ""}${fmtMoney(cent, currency, kurs)}`;
}

export interface SimFrame {
  rows: EntryRow[];
  /** Berapa entry sudah terbuka. */
  opened: number;
  /** Berapa grid harga sudah berbalik (retrace) dari titik terjauh. */
  retrace: number;
  phase: "idle" | "loss" | "bottom" | "recover" | "done";
  netCent: number;
  peakLossCent: number;
  equityLeftUsd: number;
  blown: boolean;
  totalLot: number;
}

/**
 * Total langkah simulasi: fase 1 buka SEMUA entry sampai titik terjauh (full loss),
 * lalu fase 2 harga berbalik grid demi grid sampai entry profit terpenuhi.
 */
export function simTotalSteps(input: CalcInput): number {
  const n = Math.max(0, Math.round(input.entries));
  const loss = Math.max(0, Math.min(n, Math.round(input.lossEntries)));
  return n + Math.max(0, n - loss);
}

/** Bagian-bagian langkah simulasi yang dipakai bersama. */
function simStepParts(input: CalcInput, step: number) {
  const n = Math.max(0, Math.round(input.entries));
  const loss = Math.max(0, Math.min(n, Math.round(input.lossEntries)));
  const retraceSteps = Math.max(0, n - loss);
  const total = n + retraceSteps;
  const s = Math.max(0, Math.min(total, Math.round(step)));
  const levels = buildLevels(input, n);
  return {
    n,
    loss,
    retraceSteps,
    total,
    s,
    levels,
    opened: Math.min(n, s),
    retrace: Math.max(0, s - n),
  };
}

/**
 * Posisi harga (point dari harga awal) pada satu langkah simulasi.
 * Fase buka: harga berhenti di level entry terakhir yang dibuka.
 * Fase balik: bergerak mulus dari titik terjauh menuju titik balik.
 */
export function simPriceLevel(
  levels: number[],
  n: number,
  loss: number,
  opened: number,
  retrace: number,
  retraceSteps: number,
): number {
  const deepest = levels[n] ?? 0;
  if (retrace <= 0 || retraceSteps <= 0) return levels[opened] ?? 0;
  const target = levels[loss] ?? 0;
  return deepest + (retrace / retraceSteps) * (target - deepest);
}

/** P/L bersih (cent) pada satu langkah simulasi, tanpa membangun daftar baris. */
export function simNetCentAt(input: CalcInput, step: number): number {
  const { n, loss, retraceSteps, opened, retrace, levels } = simStepParts(input, step);
  const pipValueCent = input.pipValueCent > 0 ? input.pipValueCent : 100;
  const priceLevel = simPriceLevel(levels, n, loss, opened, retrace, retraceSteps);
  let net = 0;
  for (let i = 1; i <= opened; i++) {
    const lot = lotAt(input.lot, input.multiplier, i);
    // Positif = harga sudah lewat entry ini (rugi), negatif = sudah balik (untung).
    const awayPoints = priceLevel - (levels[i - 1] ?? 0);
    net += -lot * awayPoints * pipValueCent;
  }
  return net;
}

/** Snapshot simulasi pada langkah tertentu (0 = belum mulai). */
export function simulateFrame(input: CalcInput, step: number): SimFrame {
  const { n, loss, retraceSteps, total, s, opened, retrace, levels } = simStepParts(input, step);
  const pipValueCent = input.pipValueCent > 0 ? input.pipValueCent : 100;
  const modalCent = Math.max(0, input.modalUsd) * 100;

  const rows: EntryRow[] = [];
  let net = 0;
  let peakLoss = 0;
  let cumLot = 0;
  let blown = false;
  const priceLevel = simPriceLevel(levels, n, loss, opened, retrace, retraceSteps);
  for (let i = 1; i <= opened; i++) {
    const lot = lotAt(input.lot, input.multiplier, i);
    const awayPoints = priceLevel - (levels[i - 1] ?? 0);
    const distancePips = Math.abs(awayPoints);
    const pl = -lot * awayPoints * pipValueCent;
    net += pl;
    cumLot = Math.round((cumLot + lot) * 100) / 100;
    if (-net > peakLoss) peakLoss = -net;
    if (modalCent > 0 && -net > modalCent) blown = true;
    rows.push({
      index: i,
      lot,
      price: priceAt(input, i),
      gapPoints: (levels[i] ?? 0) - (levels[i - 1] ?? 0),
      gapManual: typeof input.gapOverrides?.[String(i)] === "number",
      distancePips,
      plCent: pl,
      cumPlCent: net,
      cumLot,
      status: awayPoints > 0 ? "loss" : awayPoints === 0 ? "bep" : "profit",
      equityLeftUsd: (modalCent + net) / 100,
      blown: modalCent > 0 && -net > modalCent,
    });
  }

  const phase: SimFrame["phase"] =
    s === 0 ? "idle" : s < n ? "loss" : s === n ? "bottom" : s < total ? "recover" : "done";

  return {
    rows,
    opened,
    retrace,
    phase,
    netCent: net,
    peakLossCent: peakLoss,
    equityLeftUsd: (modalCent + net) / 100,
    blown,
    totalLot: cumLot,
  };
}
