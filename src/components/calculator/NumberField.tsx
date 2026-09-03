import { useEffect, useState } from "react";
import { parseIdNumber } from "@/lib/ketahanan";

interface NumberFieldProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
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
    <label className="flex flex-col gap-1.5">
      <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        inputMode="decimal"
        value={text}
        onChange={(e) => commit(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-lg text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
