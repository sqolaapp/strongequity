import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { InputPanel } from "@/components/calculator/InputPanel";
import { SummaryCards } from "@/components/calculator/SummaryCards";
import { EntriesTable } from "@/components/calculator/EntriesTable";
import { computeKetahanan, fmtLot, type CalcInput } from "@/lib/ketahanan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kalkulator Ketahanan Equity | Flat & Martingale" },
      {
        name: "description",
        content:
          "Hitung berapa equity yang harus Anda punya agar strategi multi-entry bertahan: floating loss total dalam cent, USD, rupiah, dan persen risiko modal.",
      },
      { property: "og:title", content: "Kalkulator Ketahanan Equity" },
      {
        property: "og:description",
        content:
          "Simulasi floating loss multi-entry flat & martingale dengan output cent, USD, rupiah, dan persen risiko.",
      },
    ],
  }),
  component: Index,
});

const DEFAULTS: CalcInput = {
  point: 100,
  lot: 0.1,
  multiplier: 1,
  entries: 20,
  kurs: 16500,
};

function Index() {
  const [input, setInput] = useState<CalcInput>(DEFAULTS);
  const [modalUsd, setModalUsd] = useState(3000);

  const result = useMemo(() => computeKetahanan(input), [input]);

  const update = <K extends keyof CalcInput>(key: K, value: CalcInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setInput(DEFAULTS);
    setModalUsd(3000);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            My Jurnal — Calculator
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Kalkulator Ketahanan Equity
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Hitung total floating loss dari seluruh entry Anda, lalu lihat berapa
            equity minimum yang harus tersedia agar posisi tetap bertahan sampai
            entry terakhir.
          </p>
        </header>

        <InputPanel
          input={input}
          modalUsd={modalUsd}
          onChange={update}
          onModalChange={setModalUsd}
          onReset={reset}
        />

        <SummaryCards result={result} modalUsd={modalUsd} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoBox label="Total posisi" value={`${input.entries} entry`} />
          <InfoBox label="Lot entry terakhir" value={fmtLot(result.worstLot)} />
          <InfoBox
            label="Total jarak floating"
            value={`${(input.entries * input.point).toLocaleString("id-ID")} pips`}
          />
        </div>

        <EntriesTable rows={result.rows} />

        <footer className="pb-4 text-xs leading-relaxed text-muted-foreground">
          Asumsi perhitungan: 1 pip pada 1,00 lot = 100 cent ($1 per 0,10 lot per
          pip). Entry ke-i berjarak (entries + 1 − i) × point dari titik terjauh,
          dan lot entry ke-i = lot × multiplier^(i−1).
        </footer>
      </div>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="font-display text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
