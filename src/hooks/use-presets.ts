import { useCallback, useEffect, useState } from "react";
import { DEFAULT_INPUT, type CalcInput } from "@/lib/ketahanan";

export interface Preset {
  id: string;
  name: string;
  createdAt: number;
  input: CalcInput;
}

const STORAGE_KEY = "ketahanan-presets-v1";

/** Preset contoh untuk langsung dites tanpa isi manual. */
export const SAMPLE_PRESETS: Preset[] = [
  {
    id: "sample-flat",
    name: "Flat 0,1 × 20 (jurnal)",
    createdAt: 0,
    input: { ...DEFAULT_INPUT },
  },
  {
    id: "sample-marti",
    name: "Martingale 1,3 × 12",
    createdAt: 0,
    input: { ...DEFAULT_INPUT, lot: 0.01, multiplier: 1.3, entries: 12, modalUsd: 500 },
  },
  {
    id: "sample-scalp",
    name: "Scalping 30 point × 10",
    createdAt: 0,
    input: { ...DEFAULT_INPUT, point: 30, lot: 0.05, entries: 10, modalUsd: 300 },
  },
  {
    id: "sample-cent",
    name: "Cent account 1,5 × 8",
    createdAt: 0,
    input: { ...DEFAULT_INPUT, point: 50, lot: 0.02, multiplier: 1.5, entries: 8, modalUsd: 100 },
  },
];

function isCalcInput(v: unknown): v is CalcInput {
  if (!v || typeof v !== "object") return false;
  return Object.keys(DEFAULT_INPUT).every(
    (k) => typeof (v as Record<string, unknown>)[k] === "number",
  );
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

  const clearAll = useCallback(() => persist([]), [persist]);

  return { presets, ready, savePreset, deletePreset, clearAll };
}
