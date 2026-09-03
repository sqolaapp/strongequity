import { useCallback, useEffect, useState } from "react";
import { DEFAULT_INPUT, type CalcInput } from "@/lib/ketahanan";

export interface Preset {
  id: string;
  name: string;
  createdAt: number;
  input: CalcInput;
}

const STORAGE_KEY = "ketahanan-presets-v1";

export interface SamplePreset extends Preset {
  /** Judul kelompok, dipakai untuk memisahkan daftar di modal preset. */
  group: string;
}

/**
 * Preset contoh: semua pakai jarak 100 point, lot awal 0,10, arah buy.
 * `modalUsd` sudah diisi MODAL PAS — persis sebesar floating loss maksimum
 * di titik terjauh (saat semua entry terbuka), jadi sisa equity tepat 0.
 */
function sample(
  group: string,
  name: string,
  multiplier: number,
  entries: number,
  lossEntries: number,
  modalUsd: number,
): SamplePreset {
  return {
    id: `s-${multiplier}-${entries}-${lossEntries}`,
    name,
    group,
    createdAt: 0,
    input: { ...DEFAULT_INPUT, point: 100, lot: 0.1, multiplier, entries, lossEntries, modalUsd },
  };
}

const FLAT20 = "Flat 0,10 · 20 entry — modal pas $2.100";
const FLAT16 = "Flat 0,10 · 16 entry — modal pas $1.360";
const M11_20 = "Marti 1,1 · 20 entry — modal pas $4.303";
const M11_14 = "Marti 1,1 · 14 entry — modal pas $1.675";
const M12_20 = "Marti 1,2 · 20 entry — modal pas $10.198";
const M12_14 = "Marti 1,2 · 14 entry — modal pas $2.851";
const M13_20 = "Marti 1,3 · 20 entry — modal pas $26.654";
const M13_14 = "Marti 1,3 · 14 entry — modal pas $5.083";

export const SAMPLE_PRESETS: SamplePreset[] = [
  sample(FLAT20, "CENT - LOT FLAT 0.10 - ENTRIES 20", 1, 20, 20, 2100),
  sample(FLAT20, "CENT - LOT FLAT 0.10 - ENTRIES 20 - LOSS 9", 1, 20, 9, 2100),
  sample(FLAT20, "CENT - LOT FLAT 0.10 - ENTRIES 20 - LOSS 8", 1, 20, 8, 2100),
  sample(FLAT20, "CENT - LOT FLAT 0.10 - ENTRIES 20 - LOSS 7", 1, 20, 7, 2100),
  sample(FLAT20, "CENT - LOT FLAT 0.10 - ENTRIES 20 - LOSS 6", 1, 20, 6, 2100),

  sample(FLAT16, "CENT - LOT FLAT 0.10 - ENTRIES 16", 1, 16, 16, 1360),
  sample(FLAT16, "CENT - LOT FLAT 0.10 - ENTRIES 16 - LOSS 7", 1, 16, 7, 1360),
  sample(FLAT16, "CENT - LOT FLAT 0.10 - ENTRIES 16 - LOSS 6", 1, 16, 6, 1360),
  sample(FLAT16, "CENT - LOT FLAT 0.10 - ENTRIES 16 - LOSS 5", 1, 16, 5, 1360),
  sample(FLAT16, "CENT - LOT FLAT 0.10 - ENTRIES 16 - LOSS 4", 1, 16, 4, 1360),

  sample(M11_20, "CENT - MARTI 1,1 - ENTRIES 20", 1.1, 20, 20, 4303),
  sample(M11_20, "CENT - MARTI 1,1 - ENTRIES 20 - LOSS 12", 1.1, 20, 12, 4303),
  sample(M11_20, "CENT - MARTI 1,1 - ENTRIES 20 - LOSS 11", 1.1, 20, 11, 4303),
  sample(M11_20, "CENT - MARTI 1,1 - ENTRIES 20 - LOSS 10", 1.1, 20, 10, 4303),
  sample(M11_20, "CENT - MARTI 1,1 - ENTRIES 20 - LOSS 9", 1.1, 20, 9, 4303),

  sample(M11_14, "CENT - MARTI 1,1 - ENTRIES 14", 1.1, 14, 14, 1675),
  sample(M11_14, "CENT - MARTI 1,1 - ENTRIES 14 - LOSS 7", 1.1, 14, 7, 1675),
  sample(M11_14, "CENT - MARTI 1,1 - ENTRIES 14 - LOSS 6", 1.1, 14, 6, 1675),
  sample(M11_14, "CENT - MARTI 1,1 - ENTRIES 14 - LOSS 5", 1.1, 14, 5, 1675),
  sample(M11_14, "CENT - MARTI 1,1 - ENTRIES 14 - LOSS 4", 1.1, 14, 4, 1675),

  sample(M12_20, "CENT - MARTI 1,2 - ENTRIES 20", 1.2, 20, 20, 10198),
  sample(M12_20, "CENT - MARTI 1,2 - ENTRIES 20 - LOSS 12", 1.2, 20, 12, 10198),
  sample(M12_20, "CENT - MARTI 1,2 - ENTRIES 20 - LOSS 11", 1.2, 20, 11, 10198),
  sample(M12_20, "CENT - MARTI 1,2 - ENTRIES 20 - LOSS 10", 1.2, 20, 10, 10198),
  sample(M12_20, "CENT - MARTI 1,2 - ENTRIES 20 - LOSS 9", 1.2, 20, 9, 10198),

  sample(M12_14, "CENT - MARTI 1,2 - ENTRIES 14", 1.2, 14, 14, 2851),
  sample(M12_14, "CENT - MARTI 1,2 - ENTRIES 14 - LOSS 7", 1.2, 14, 7, 2851),
  sample(M12_14, "CENT - MARTI 1,2 - ENTRIES 14 - LOSS 6", 1.2, 14, 6, 2851),
  sample(M12_14, "CENT - MARTI 1,2 - ENTRIES 14 - LOSS 5", 1.2, 14, 5, 2851),
  sample(M12_14, "CENT - MARTI 1,2 - ENTRIES 14 - LOSS 4", 1.2, 14, 4, 2851),

  sample(M13_20, "CENT - MARTI 1,3 - ENTRIES 20", 1.3, 20, 20, 26654),
  sample(M13_20, "CENT - MARTI 1,3 - ENTRIES 20 - LOSS 12", 1.3, 20, 12, 26654),
  sample(M13_20, "CENT - MARTI 1,3 - ENTRIES 20 - LOSS 11", 1.3, 20, 11, 26654),
  sample(M13_20, "CENT - MARTI 1,3 - ENTRIES 20 - LOSS 10", 1.3, 20, 10, 26654),
  sample(M13_20, "CENT - MARTI 1,3 - ENTRIES 20 - LOSS 9", 1.3, 20, 9, 26654),

  sample(M13_14, "CENT - MARTI 1,3 - ENTRIES 14", 1.3, 14, 14, 5083),
  sample(M13_14, "CENT - MARTI 1,3 - ENTRIES 14 - LOSS 7", 1.3, 14, 7, 5083),
  sample(M13_14, "CENT - MARTI 1,3 - ENTRIES 14 - LOSS 6", 1.3, 14, 6, 5083),
  sample(M13_14, "CENT - MARTI 1,3 - ENTRIES 14 - LOSS 5", 1.3, 14, 5, 5083),
  sample(M13_14, "CENT - MARTI 1,3 - ENTRIES 14 - LOSS 4", 1.3, 14, 4, 5083),
];

function isCalcInput(v: unknown): v is CalcInput {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  const dir = obj["direction"];
  if (dir !== "buy" && dir !== "sell") return false;
  return Object.keys(DEFAULT_INPUT).every((k) => k === "direction" || typeof obj[k] === "number");
}

function read(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Preset =>
        !!p && typeof p.id === "string" && typeof p.name === "string" && isCalcInput(p.input),
    );
  } catch {
    return [];
  }
}

function write(presets: Preset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    /* storage penuh / diblokir */
  }
}

export function usePresets() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPresets(read());
    setReady(true);
  }, []);

  const persist = useCallback((next: Preset[]) => {
    setPresets(next);
    write(next);
  }, []);

  const savePreset = useCallback(
    (name: string, input: CalcInput) => {
      const clean = name.trim() || `Preset ${new Date().toLocaleString("id-ID")}`;
      const next = [
        ...read().filter((p) => p.name.toLowerCase() !== clean.toLowerCase()),
        { id: `${Date.now()}`, name: clean, createdAt: Date.now(), input: { ...input } },
      ].sort((a, b) => b.createdAt - a.createdAt);
      persist(next);
      return clean;
    },
    [persist],
  );

  const deletePreset = useCallback(
    (id: string) => persist(read().filter((p) => p.id !== id)),
    [persist],
  );

  const renamePreset = useCallback(
    (id: string, name: string) => {
      const clean = name.trim();
      if (!clean) return;
      persist(read().map((p) => (p.id === id ? { ...p, name: clean } : p)));
    },
    [persist],
  );

  const updatePreset = useCallback(
    (id: string, input: CalcInput) => {
      persist(read().map((p) => (p.id === id ? { ...p, input: { ...input } } : p)));
    },
    [persist],
  );

  const clearAll = useCallback(() => persist([]), [persist]);

  return { presets, ready, savePreset, deletePreset, renamePreset, updatePreset, clearAll };
}
