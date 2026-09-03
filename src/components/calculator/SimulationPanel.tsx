import { Pause, Play, RotateCcw } from "lucide-react";
import { SimulationChart } from "./SimulationChart";
import type { CalcInput, Currency, SimFrame } from "@/lib/ketahanan";
import { fmtLot, fmtMoneySigned } from "@/lib/ketahanan";

interface SimulationPanelProps {
  input: CalcInput;
  frame: SimFrame;
  totalSteps: number;
  currency: Currency;
  step: number;
  playing: boolean;
  direction: CalcInput["direction"];
  onDirectionChange: (direction: CalcInput["direction"]) => void;
  onToggle: () => void;
  onReset: () => void;
}

export function SimulationPanel({
  input,
  frame,
  totalSteps,
  currency,
  step,
  playing,
  direction,
  onDirectionChange,
  onToggle,
  onReset,
}: SimulationPanelProps) {
  const kurs = input.kurs;
  const entries = input.entries;
  const netCent = frame.netCent;
  const equityUsd = frame.equityLeftUsd;
  const openLot = frame.totalLot;
  const blown = frame.blown;
  const phase =
    frame.phase === "idle"
      ? "SIAP"
      : blown
        ? "MARGIN CALL"
        : frame.phase === "loss"
          ? "FLOATING LOSS"
          : frame.phase === "bottom"
            ? "TITIK TERJAUH"
            : frame.phase === "recover"
              ? "HARGA BERBALIK"
              : "SELESAI";
  // Versi pendek dipakai di layar sempit supaya header tetap satu baris.
  const phaseShort =
    frame.phase === "idle"
      ? "SIAP"
      : blown
        ? "MC"
        : frame.phase === "loss"
          ? "LOSS"
          : frame.phase === "bottom"
            ? "TERJAUH"
            : frame.phase === "recover"
              ? "BALIK"
              : "SELESAI";
  const phaseClass = blown
    ? "bg-destructive text-destructive-foreground"
    : frame.phase === "recover" || frame.phase === "done"
      ? "bg-primary text-primary-foreground"
      : frame.phase === "loss" || frame.phase === "bottom"
        ? "bg-accent text-accent-foreground"
        : "bg-secondary text-secondary-foreground";

  return (
    <section aria-label="Simulasi entry" className="brutal bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <h2 className="font-display text-[11px] font-bold uppercase tracking-wider text-foreground sm:text-xs sm:tracking-widest">
            <span className="sm:hidden">Simulasi</span>
            <span className="hidden sm:inline">Simulasi Entry</span>
          </h2>
          <span
            key={phase}
            title={phase}
            className={`brutal anim-value whitespace-nowrap px-1.5 py-0.5 font-display text-[9px] font-bold tracking-widest sm:px-2 ${phaseClass}`}
          >
            <span className="sm:hidden">{phaseShort}</span>
            <span className="hidden sm:inline">{phase}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="brutal flex shrink-0 bg-background">
            {(["buy", "sell"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDirectionChange(d)}
                aria-pressed={direction === d}
                title={d === "buy" ? "Buy: harga turun dulu" : "Sell: harga naik dulu"}
                className={`px-2 py-1.5 font-display text-[9px] font-bold uppercase tracking-widest transition-colors sm:px-2.5 sm:text-[10px] ${
                  d === "sell" ? "border-l-2 border-border" : ""
                } ${
                  direction === d
                    ? d === "buy"
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-destructive-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? "Jeda simulasi" : "Mulai simulasi"}
            title={playing ? "Jeda" : "Mulai simulasi"}
            className={`brutal-press shrink-0 bg-primary p-1.5 text-primary-foreground ${playing ? "anim-live" : ""}`}
          >
            {playing ? <Pause className="size-4" strokeWidth={2.5} /> : <Play className="size-4" strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset simulasi"
            title="Reset simulasi"
            className="brutal-press shrink-0 bg-secondary p-1.5 text-secondary-foreground"
          >
            <RotateCcw className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-4">
        <Cell
          label={frame.phase === "recover" || frame.phase === "done" ? "Balik (grid)" : "Entry masuk"}
          value={
            frame.phase === "recover" || frame.phase === "done"
              ? `${frame.retrace} grid`
              : `${frame.opened} / ${entries}`
          }
        />
        <Cell label="Total lot open" value={fmtLot(openLot)} />
        <Cell
          label="Floating P/L"
          value={fmtMoneySigned(netCent, currency, kurs)}
          tone={netCent >= 0 ? "primary" : "danger"}
        />
        <Cell
          label="Sisa equity"
          value={fmtMoneySigned(equityUsd * 100, currency, kurs)}
          tone={equityUsd < 0 ? "danger" : "plain"}
        />
      </div>

      <SimulationChart
        input={input}
        frame={frame}
        totalSteps={totalSteps}
        step={step}
        playing={playing}
        currency={currency}
        kurs={kurs}
      />
    </section>
  );
}

function Cell({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string;
  tone?: "plain" | "primary" | "danger";
}) {
  const fg = tone === "primary" ? "text-primary" : tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="border-b-2 border-foreground/10 px-3 py-2">
      <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-mono text-xs font-bold transition-colors duration-300 sm:text-sm ${fg}`}>
        <span key={value} className="anim-value">
          {value}
        </span>
      </p>
    </div>
  );
}
