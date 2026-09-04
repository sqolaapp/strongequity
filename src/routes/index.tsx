import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { InputPanel } from "@/components/calculator/InputPanel";
import { SummaryCards } from "@/components/calculator/SummaryCards";
import { EntriesTable } from "@/components/calculator/EntriesTable";
import { SimulationPanel } from "@/components/calculator/SimulationPanel";
import { PresetModal } from "@/components/calculator/PresetModal";
import { ThemeToggle } from "@/components/calculator/ThemeToggle";
import { usePresets } from "@/hooks/use-presets";
import { useKurs } from "@/hooks/use-kurs";
import { useDebounced } from "@/hooks/use-debounced";
import { useSimulation } from "@/hooks/use-simulation";
import {
  computeKetahanan,
  simTotalSteps,
  simulateFrame,
  DEFAULT_INPUT,
  type CalcInput,
  type Currency,
} from "@/lib/ketahanan";

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
  const [currency, setCurrency] = useState<Currency>("cent");
  const { presets, savePreset, deletePreset, renamePreset, updatePreset } = usePresets();

  const debouncedInput = useDebounced(input, 2000);
  const result = useMemo(() => computeKetahanan(debouncedInput), [debouncedInput]);

  const totalSteps = useMemo(() => simTotalSteps(debouncedInput), [debouncedInput]);
  const sim = useSimulation(totalSteps, debouncedInput);
  const frame = useMemo(() => simulateFrame(debouncedInput, sim.step), [debouncedInput, sim.step]);

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

  /** Tulis jarak khusus untuk satu langkah grid. null = kembali ikut pola. */
  const setGapOverride = (step: number, value: number | null) => {
    setInput((prev) => {
      const next = { ...prev.gapOverrides };
      if (value === null || !(value > 0)) delete next[String(step)];
      else next[String(step)] = value;
      return { ...prev, gapOverrides: next };
    });
  };

  const handleUpdate = (id: string) => {
    updatePreset(id, input);
    flash("Preset diperbarui dengan nilai input saat ini.");
  };

  return (
    <main className="min-h-screen bg-background px-3 py-5 sm:px-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              SUPER CLUSTER
            </p>
            <h1 className="font-display text-xl font-extrabold uppercase leading-tight tracking-tight text-foreground sm:text-2xl">
              HITUNG STRONG EQUITY
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <PresetModal
              presets={presets}
              onLoad={handleLoad}
              onSave={handleSave}
              onDelete={deletePreset}
              onRename={renamePreset}
              onUpdate={handleUpdate}
            />
            <ThemeToggle />
          </div>
        </header>

        {note ? (
          <p className="brutal anim-row-in bg-primary px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            {note}
          </p>
        ) : null}

        <div className="anim-section" style={{ animationDelay: "60ms" }}>
          <InputPanel
            input={input}
            onChange={update}
            onReset={() => setInput(DEFAULT_INPUT)}
            kursLoading={kurs.loading}
            kursError={kurs.error}
            kursUpdatedAt={kurs.updatedAt}
            onRefreshKurs={kurs.refresh}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="anim-section" style={{ animationDelay: "140ms" }}>
            <SimulationPanel
              input={debouncedInput}
              frame={frame}
              totalSteps={totalSteps}
              currency={currency}
              step={sim.step}
              playing={sim.playing}
              direction={input.direction}
              onDirectionChange={(d) => update("direction", d)}
              onToggle={sim.toggle}
              onReset={sim.reset}
            />
          </div>

          <div className="anim-section" style={{ animationDelay: "220ms" }}>
            <EntriesTable
              rows={sim.running ? frame.rows : result.rows}
              entries={input.entries}
              lossEntries={input.lossEntries}
              onLossEntriesChange={(v) => update("lossEntries", v)}
              currency={currency}
              onCurrencyChange={setCurrency}
              kurs={debouncedInput.kurs}
              startPrice={input.startPrice}
              onStartPriceChange={(v) => update("startPrice", v)}
              onGapChange={setGapOverride}
              manualGapCount={Object.keys(input.gapOverrides).length}
              onResetGaps={() => update("gapOverrides", {})}
              simNote={
                sim.running
                  ? frame.phase === "recover" || frame.phase === "done"
                    ? `Harga berbalik ${frame.retrace} grid — ${frame.opened} entry terbuka`
                    : `Simulasi berjalan… ${frame.opened} / ${debouncedInput.entries} entry masuk`
                  : undefined
              }
            />
          </div>

          <div className="anim-section" style={{ animationDelay: "300ms" }}>
            <SummaryCards
              result={result}
              entries={debouncedInput.entries}
              currency={currency}
              kurs={debouncedInput.kurs}
              lossEntries={debouncedInput.lossEntries}
            />
          </div>
        </div>


        <footer className="pb-4 text-[10px] leading-relaxed text-muted-foreground">
          Rumus: lot entry ke-i = lot × multiplier^(i−1); floating loss entry ke-i = lot × (entries
          + 1 − i) × point × nilai per pip. BUY: loss menumpuk dari atas, profit dihitung dari
          entry paling bawah ke atas (grid 1, 2, 3, ...). SELL: dibalik. Skenario terburuk: harga
          menembus semua entry sampai titik terjauh. Preset disimpan di browser Anda (local
          storage).
        </footer>
      </div>
    </main>
  );
}
