import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { InputPanel } from "@/components/calculator/InputPanel";
import { SummaryCards } from "@/components/calculator/SummaryCards";
import { EntriesTable } from "@/components/calculator/EntriesTable";
import { PresetModal } from "@/components/calculator/PresetModal";
import { ThemeToggle } from "@/components/calculator/ThemeToggle";
import { usePresets } from "@/hooks/use-presets";
import { useKurs } from "@/hooks/use-kurs";
import { computeKetahanan, DEFAULT_INPUT, type CalcInput } from "@/lib/ketahanan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kalkulator Ketahanan Equity | Flat & Martingale" },
      {
        name: "description",
        content:
          "Hitung berapa equity yang harus Anda punya agar strategi multi-entry bertahan: floating loss total dalam cent, USD, rupiah, persen risiko, plus preset tersimpan.",
      },
      { property: "og:title", content: "Kalkulator Ketahanan Equity" },
      {
        property: "og:description",
        content:
          "Simulasi floating loss multi-entry flat & martingale dengan output cent, USD, rupiah, dan persen risiko.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [input, setInput] = useState<CalcInput>(DEFAULT_INPUT);
  const [note, setNote] = useState<string | null>(null);
  const { presets, savePreset, deletePreset } = usePresets();

  const result = useMemo(() => computeKetahanan(input), [input]);

  const kurs = useKurs((rate) => setInput((prev) => ({ ...prev, kurs: rate })));

  const update = <K extends keyof CalcInput>(key: K, value: CalcInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(null), 2200);
  };

  const handleSave = (name: string) => {
    const saved = savePreset(name, input);
    flash(`Preset "${saved}" tersimpan.`);
  };

  const handleLoad = (loaded: CalcInput) => {
    setInput({ ...DEFAULT_INPUT, ...loaded });
    flash("Preset dimuat.");
  };

  return (
    <main className="min-h-screen bg-background px-3 py-5 sm:px-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              My Jurnal
            </p>
            <h1 className="font-display text-xl font-extrabold uppercase leading-tight tracking-tight text-foreground sm:text-2xl">
              Kalkulator Ketahanan Equity
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <PresetModal
              presets={presets}
              onLoad={handleLoad}
              onSave={handleSave}
              onDelete={deletePreset}
            />
            <ThemeToggle />
          </div>
        </header>

        {note ? (
          <p className="brutal bg-primary px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            {note}
          </p>
        ) : null}

        <InputPanel
          input={input}
          onChange={update}
          onReset={() => setInput(DEFAULT_INPUT)}
          kursLoading={kurs.loading}
          kursError={kurs.error}
          kursUpdatedAt={kurs.updatedAt}
          onRefreshKurs={kurs.refresh}
        />

        <SummaryCards result={result} entries={input.entries} />

        <EntriesTable rows={result.rows} />

        <footer className="pb-4 text-[10px] leading-relaxed text-muted-foreground">
          Rumus: lot entry ke-i = lot × multiplier^(i−1); jarak entry ke-i = (entries + 1 − i) ×
          point; floating loss = lot × jarak × nilai per pip. Skenario terburuk: harga menembus
          semua entry sampai titik terjauh. Preset disimpan di browser Anda (local storage).
        </footer>
      </div>
    </main>
  );
}
