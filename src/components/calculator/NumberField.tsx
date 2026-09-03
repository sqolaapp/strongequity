import { useEffect, useState } from "react";
import { parseIdNumber } from "@/lib/ketahanan";

interface NumberFieldProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}

export function NumberField({ label, hint, value, onChange }: NumberFieldProps) {
  const [text, setText] = useState(String(value).replace(".", ","));

  useEffect(() => {
    setText(String(value).replace(".", ","));
  }, [value]);

  const commit = (raw: string) => {
    setText(raw);
    const parsed = parseIdNumber(raw);
    if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="font-display text-[10px] font-bold uppercase tracking-widest text-foreground">
        {label}
      </span>
      <input
        inputMode="decimal"
        value={text}
        onChange={(e) => commit(e.target.value)}
        className="brutal w-full bg-background px-2 py-1.5 font-mono text-sm font-semibold text-foreground outline-none focus:bg-primary/20"
      />
      {hint ? (
        <span className="text-[10px] leading-tight text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
