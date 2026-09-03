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
    <section aria-label="Input kalkulator" className="brutal bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
          Input
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="brutal-press bg-secondary px-2 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-secondary-foreground"
        >
          Reset
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <NumberField
          label="Point"
          hint="Jarak antar entry"
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
          hint="1 = flat"
          value={input.multiplier}
          onChange={(v) => onChange("multiplier", v)}
        />
        <NumberField
          label="Entries"
          hint="Maks 200"
          value={input.entries}
          onChange={(v) => onChange("entries", Math.max(1, Math.min(200, Math.round(v))))}
        />
        <NumberField
          label="Kurs"
          hint="USD → IDR"
          value={input.kurs}
          onChange={(v) => onChange("kurs", v)}
        />
        <NumberField
          label="Modal $"
          hint="Equity Anda"
          value={modalUsd}
          onChange={onModalChange}
        />
      </div>
    </section>
  );
}
