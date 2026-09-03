import { NumberField } from "./NumberField";
import type { CalcInput } from "@/lib/ketahanan";

interface InputPanelProps {
  input: CalcInput;
  modalUsd: number;
  onChange: <K extends keyof CalcInput>(key: K, value: CalcInput[K]) => void;
  onModalChange: (v: number) => void;
  onReset: () => void;
}

export function InputPanel({
  input,
  modalUsd,
  onChange,
  onModalChange,
  onReset,
}: InputPanelProps) {
  return (
    <section
      aria-label="Input kalkulator"
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">
          Input
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-border px-3 py-1.5 font-display text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Reset default
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Point"
          hint="Jarak antar entry (pips)"
          value={input.point}
          onChange={(v) => onChange("point", v)}
        />
        <NumberField
          label="Lot"
          hint="Lot entry pertama"
          value={input.lot}
          onChange={(v) => onChange("lot", v)}
        />
        <NumberField
          label="Multiplier"
          hint="1 = flat, 1,1 = martingale"
          value={input.multiplier}
          onChange={(v) => onChange("multiplier", v)}
        />
        <NumberField
          label="Entries"
          hint="Jumlah entry maksimum"
          value={input.entries}
          onChange={(v) => onChange("entries", Math.max(1, Math.min(200, Math.round(v))))}
        />
        <NumberField
          label="Kurs USD/IDR"
          hint="Untuk konversi rupiah"
          value={input.kurs}
          onChange={(v) => onChange("kurs", v)}
        />
        <NumberField
          label="Modal (USD)"
          hint="Equity yang Anda miliki"
          value={modalUsd}
          onChange={onModalChange}
        />
      </div>
    </section>
  );
}
