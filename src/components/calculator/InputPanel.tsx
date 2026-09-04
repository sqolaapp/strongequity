import { RefreshCw, RotateCcw } from "lucide-react";
import { NumberField } from "./NumberField";
import { fmtCent, fmtPips, fmtRp, gridGapAt } from "@/lib/ketahanan";
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

      <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
        <NumberField
          label="JARAK (POINT)"
          hint="Jarak antar entry"
          value={input.point}
          onChange={(v) => onChange("point", v)}
        />
        <NumberField
          label="Lot"
          hint="Lot awal entry ke-1"
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
          onChange={(v) => {
            const entries = Math.max(1, Math.min(200, Math.round(v)));
            onChange("entries", entries);
            if (input.lossEntries > entries) onChange("lossEntries", entries);
          }}
        />
        <div>
          <NumberField
            label="Modal $"
            hint="Equity Anda"
            value={input.modalUsd}
            onChange={(v) => onChange("modalUsd", v)}
          />
          <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
            ≈ {fmtCent(input.modalUsd * 100)} cent / Rp{fmtRp(input.modalUsd * input.kurs)}
          </p>
        </div>
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

      <div className="mt-3 border-t-2 border-foreground/10 pt-3">
        <div className="flex flex-wrap items-end gap-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-foreground">
            Jarak bertingkat
          </p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            {gridPreview(input)}
          </p>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-6">
          <NumberField
            label="Per grup"
            hint="Entry tiap tingkat"
            value={input.gridGroup}
            onChange={(v) => onChange("gridGroup", Math.max(1, Math.round(v)))}
          />
          <NumberField
            label="Pengali"
            hint="1 = jarak seragam"
            value={input.gridStep}
            onChange={(v) => onChange("gridStep", v)}
          />
          {/* Struktur & tinggi disamakan dengan NumberField supaya sejajar. */}
          <div className="flex flex-col gap-1">
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-foreground">
              Pola
            </span>
            <div className="brutal flex bg-background">
              {(
                [
                  ["add", "Tambah"],
                  ["multiply", "Lipat"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange("gridMode", mode)}
                  aria-pressed={input.gridMode === mode}
                  className={`flex-1 px-1 py-1.5 font-display text-[10px] font-bold uppercase leading-5 tracking-widest transition-colors ${
                    mode === "multiply" ? "border-l-2 border-border" : ""
                  } ${
                    input.gridMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[10px] leading-tight text-muted-foreground">
              {input.gridMode === "add" ? "1×, 2×, 3×" : "1×, 2×, 4×"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Contoh jarak beberapa langkah pertama, biar polanya langsung kelihatan. */
function gridPreview(input: CalcInput): string {
  const gaps = Array.from({ length: 6 }, (_, i) => gridGapAt(input, i + 1));
  const seragam = gaps.every((g) => g === gaps[0]);
  if (seragam) return `Semua jarak ${fmtPips(gaps[0] ?? 0)} point (seragam)`;
  return `${gaps.map((g) => fmtPips(g)).join(" · ")} …point`;
}
