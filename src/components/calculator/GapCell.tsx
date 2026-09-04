import { useEffect, useRef, useState } from "react";
import { parseIdNumber } from "@/lib/ketahanan";

interface GapCellProps {
  /** Nomor langkah grid yang diedit (= nomor entry pada baris ini). */
  step: number;
  /** Jarak yang sedang berlaku (point), entah dari pola atau tulisan manual. */
  value: number;
  /** True kalau nilai ini ditulis manual. */
  manual: boolean;
  /** Kirim null untuk mengembalikan baris ini ke pola. */
  onChange: (step: number, value: number | null) => void;
}

/**
 * Sel jarak yang bisa ditulis langsung di tabel. Teks yang sedang diketik
 * disimpan lokal supaya tidak dipentalkan tiap keystroke; dikosongkan =
 * kembali mengikuti pola.
 */
export function GapCell({ step, value, manual, onChange }: GapCellProps) {
  const [text, setText] = useState(String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setText(String(value));
  }, [value]);

  const commit = (raw: string) => {
    setText(raw);
    if (raw.trim() === "") {
      onChange(step, null);
      return;
    }
    const parsed = parseIdNumber(raw);
    if (Number.isFinite(parsed) && parsed > 0) onChange(step, parsed);
  };

  return (
    <input
      inputMode="decimal"
      value={text}
      title={
        manual
          ? "Jarak ditulis manual — kosongkan untuk kembali ke pola"
          : "Jarak dari pola. Ketik untuk menimpa baris ini."
      }
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        setText(String(value));
      }}
      onChange={(e) => commit(e.target.value)}
      className={`w-14 border-2 bg-transparent px-1 py-0 text-right font-mono text-[10px] outline-none focus:bg-primary/20 sm:text-xs ${
        manual ? "border-accent font-bold text-foreground" : "border-transparent text-muted-foreground"
      }`}
    />
  );
}
