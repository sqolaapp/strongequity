import { ArrowDown, ArrowUp, RefreshCw, RotateCcw } from "lucide-react";
import { NumberField } from "./NumberField";
import type { CalcInput } from "@/lib/ketahanan";

interface InputPanelProps {
  input: CalcInput;
  onChange: <K extends keyof CalcInput>(key: K, value: CalcInput[K]) => void;
  onReset: () => void;
  kursLoading?: boolean;
  kursError?: string | null;
  kursUpdatedAt?: string | null;
  onRefreshKurs?: () => void;
}

export function InputPanel({
  input,
  onChange,
  onReset,
  kursLoading,
  kursError,
  kursUpdatedAt,
  onRefreshKurs,
}: InputPanelProps) {
  return (
    <section aria-label="Input kalkulator" className="brutal bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
          Input
        </h2>
        <div className="flex items-center gap-1.5">
          <div
            role="group"
            aria-label="Arah posisi"
            className="brutal flex overflow-hidden bg-secondary"
          >
            {(["buy", "sell"] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => onChange("direction", dir)}
                aria-pressed={input.direction === dir}
                title={dir === "buy" ? "Buy: profit dari bawah ke atas" : "Sell: profit dari atas ke bawah"}
                className={`flex items-center gap-1 px-2 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest ${
                  input.direction === dir
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {dir === "buy" ? (
                  <ArrowUp className="size-3" strokeWidth={3} />
                ) : (
                  <ArrowDown className="size-3" strokeWidth={3} />
                )}
                {dir}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset input"
            title="Reset"
            className="brutal-press bg-secondary p-1.5 text-secondary-foreground"
          >
            <RotateCcw className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
        <NumberField
          label="JARAK (POINT)"
          hint="Jarak antar entry (pips)"
          value={input.point}
          onChange={(v) => onChange("point", v)}
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
          onChange={(v) => {
            const entries = Math.max(1, Math.min(200, Math.round(v)));
            onChange("entries", entries);
            if (input.lossEntries > entries) onChange("lossEntries", entries);
          }}
        />
        <NumberField
          label="Entry Loss"
          hint="Sisanya profit saat harga berbalik"
          value={input.lossEntries}
          onChange={(v) =>
            onChange("lossEntries", Math.max(0, Math.min(input.entries, Math.round(v))))
          }
        />
        <NumberField
          label="Modal $"
          hint="Equity Anda"
          value={input.modalUsd}
          onChange={(v) => onChange("modalUsd", v)}
        />
        <div className="relative">
          <NumberField
            label="Kurs"
            hint={
              kursError
                ? kursError
                : kursUpdatedAt
                  ? "Kurs live USD → IDR"
                  : "USD → IDR"
            }
            value={input.kurs}
            onChange={(v) => onChange("kurs", v)}
          />
          {onRefreshKurs ? (
            <button
              type="button"
              onClick={onRefreshKurs}
              aria-label="Perbarui kurs live"
              title="Perbarui kurs"
              className="brutal-press absolute right-1 top-[22px] bg-secondary p-1 text-secondary-foreground"
            >
              <RefreshCw
                className={`size-3.5 ${kursLoading ? "animate-spin" : ""}`}
                strokeWidth={2.5}
              />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
