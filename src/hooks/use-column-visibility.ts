import { useCallback, useEffect, useState } from "react";

/** Kolom tabel rincian yang boleh disembunyikan (kolom "#" selalu tampil). */
export type ColumnKey = "price" | "gap" | "lot" | "pl" | "cum" | "left";

export const COLUMN_KEYS: ColumnKey[] = ["price", "gap", "lot", "pl", "cum", "left"];

export const COLUMN_LABEL: Record<ColumnKey, string> = {
  price: "Harga",
  gap: "Jarak (point)",
  lot: "Lot",
  pl: "P/L",
  cum: "Akumulasi",
  left: "Sisa equity",
};

export type ColumnVisibility = Record<ColumnKey, boolean>;

const STORAGE_KEY = "ketahanan-columns-v1";
const ALL_VISIBLE: ColumnVisibility = {
  price: true,
  gap: true,
  lot: true,
  pl: true,
  cum: true,
  left: true,
};

function read(): ColumnVisibility {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_VISIBLE;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return ALL_VISIBLE;
    const obj = parsed as Record<string, unknown>;
    const next = { ...ALL_VISIBLE };
    for (const k of COLUMN_KEYS) {
      const v = obj[k];
      if (typeof v === "boolean") next[k] = v;
    }
    // Jangan pernah menyimpan kondisi semua kolom tersembunyi.
    return COLUMN_KEYS.some((k) => next[k]) ? next : ALL_VISIBLE;
  } catch {
    return ALL_VISIBLE;
  }
}

function write(value: ColumnVisibility) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage penuh / diblokir */
  }
}

/**
 * Pilihan kolom yang tampil, tersimpan di browser. Nilai awal sengaja "semua
 * tampil" lalu dibaca dari localStorage di effect, supaya render server dan
 * client tidak berbeda.
 */
export function useColumnVisibility() {
  const [visible, setVisible] = useState<ColumnVisibility>(ALL_VISIBLE);

  useEffect(() => {
    setVisible(read());
  }, []);

  const toggle = useCallback((key: ColumnKey) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Sisakan minimal satu kolom, kalau tidak tabelnya jadi kosong.
      if (!COLUMN_KEYS.some((k) => next[k])) return prev;
      write(next);
      return next;
    });
  }, []);

  const showAll = useCallback(() => {
    setVisible(ALL_VISIBLE);
    write(ALL_VISIBLE);
  }, []);

  const hiddenCount = COLUMN_KEYS.filter((k) => !visible[k]).length;

  return { visible, toggle, showAll, hiddenCount };
}
