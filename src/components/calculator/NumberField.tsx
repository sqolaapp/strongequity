import { useEffect, useState } from "react";
import { parseIdNumber } from "@/lib/ketahanan";

interface NumberFieldProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  /** Versi kecil untuk dipakai di baris kontrol (bukan kartu Input). */
  compact?: boolean;
}

export function NumberField({ label, hint, value, onChange, compact = false }: NumberFieldProps) {
  const [text, setText] = useState(String(value).replace(".", ","));

  useEffect(() => {
    setText((current) =>
      parseIdNumber(current) === value ? current : String(value).replace(".", ",")
    );
  }, [value]);

  const commit = (raw: string) => {
    setText(raw);
    const parsed = parseIdNumber(raw);
    if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
  };

  return (
    <label className={`flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}>
      <span
        className={`font-display font-bold uppercase tracking-widest ${
          compact ? "text-[9px] text-muted-foreground" : "text-[10px] text-foreground"
        }`}
      >
        {label}
      </span>
      <input
        inputMode="decimal"
        value={text}
        onChange={(e) => commit(e.target.value)}
        className={`brutal w-full bg-background font-mono font-semibold text-foreground outline-none focus:bg-primary/20 ${
          compact ? "px-1.5 py-1 text-right text-[10px] font-bold" : "px-2 py-1.5 text-sm"
        }`}
      />
      {hint ? (
        <span className="text-[10px] leading-tight text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
