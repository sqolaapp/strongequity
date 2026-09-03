import { Pause, Play, RotateCcw } from "lucide-react";
import type { CalcResult, Currency } from "@/lib/ketahanan";
import { fmtLot, fmtMoney, fmtMoneySigned, fmtPct } from "@/lib/ketahanan";

interface SimulationPanelProps {
  result: CalcResult;
  currency: Currency;
  kurs: number;
  modalUsd: number;
  step: number;
  playing: boolean;
  speedMs: number;
  onSpeedChange: (ms: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

export function SimulationPanel({
  result,
  currency,
  kurs,
  modalUsd,
  step,
  playing,
  speedMs,
  onSpeedChange,
  onToggle,
  onReset,
}: SimulationPanelProps) {
  const rows = result.rows;

  const current = step > 0 ? (rows[step - 1] ?? null) : null;
  const netCent = current ? current.cumPlCent : 0;
  const equityUsd = current ? current.equityLeftUsd : modalUsd;
  const openLot = rows.slice(0, step).reduce((a, r) => a + r.lot, 0);
  const drawdownPct = modalUsd > 0 ? Math.max(0, (-netCent / 100 / modalUsd) * 100) : 0;
  const blown = current?.blown ?? false;
  const phase =
    current === null
      ? "SIAP"
      : blown
        ? "MARGIN CALL"
        : current.status === "loss"
          ? "FLOATING LOSS"
          : current.status === "bep"
            ? "TITIK BALIK (BEP)"
            : "FLOATING PROFIT";
  const phaseClass = blown
    ? "bg-destructive text-destructive-foreground"
    : current?.status === "profit"
      ? "bg-primary text-primary-foreground"
      : current?.status === "loss"
        ? "bg-accent text-accent-foreground"
        : "bg-secondary text-secondary-foreground";

  return (
    <section aria-label="Simulasi entry" className="brutal bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border px-3 py-2">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
          Simulasi Entry
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <span className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Jeda (ms)
            </span>
            <input
              type="number"
              min={50}
              step={50}
              value={speedMs}
              onChange={(e) => onSpeedChange(Math.max(50, Math.round(Number(e.target.value) || 0)))}
              className="brutal w-16 bg-background px-1.5 py-1 text-right font-mono text-[10px] font-bold text-foreground outline-none"
            />
          </label>
          <span className={`brutal px-2 py-0.5 font-display text-[9px] font-bold tracking-widest ${phaseClass}`}>
            {phase}
          </span>
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? "Jeda simulasi" : "Mulai simulasi"}
            title={playing ? "Jeda" : "Mulai simulasi"}
            className="brutal-press bg-primary p-1.5 text-primary-foreground"
          >
            {playing ? <Pause className="size-4" strokeWidth={2.5} /> : <Play className="size-4" strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset simulasi"
            title="Reset simulasi"
            className="brutal-press bg-secondary p-1.5 text-secondary-foreground"
          >
            <RotateCcw className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-4">
        <Cell label="Entry berjalan" value={`${step} / ${rows.length}`} />
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

      <div className="px-3 pb-3">
        <div className="brutal h-2.5 w-full overflow-hidden bg-muted p-0">
          <div
            className={`h-full transition-all duration-300 ${blown ? "bg-destructive" : netCent >= 0 ? "bg-primary" : "bg-accent"}`}
            style={{ width: `${Math.min(100, netCent >= 0 ? (step / Math.max(1, rows.length)) * 100 : drawdownPct)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
          {current === null
            ? "Tekan play untuk mensimulasikan entry satu per satu: floating loss menumpuk dulu, lalu berbalik jadi floating profit."
            : blown
              ? `Modal habis di entry #${current.index} — drawdown ${fmtPct(drawdownPct)} dari modal.`
              : current.status === "profit"
                ? `Entry #${current.index} lot ${fmtLot(current.lot)} — harga berbalik, floating loss mulai tertutup. Profit entry ini ${fmtMoney(current.plCent, currency, kurs)}.`
                : current.status === "bep"
                  ? `Entry #${current.index} berada di titik balik (0). Setelah ini floating berubah jadi profit.`
                  : `Entry #${current.index} lot ${fmtLot(current.lot)} — floating loss ${fmtMoney(current.plCent, currency, kurs)}, drawdown ${fmtPct(drawdownPct)} dari modal.`}
        </p>
      </div>
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
      <p className={`font-mono text-xs font-bold sm:text-sm ${fg}`}>{value}</p>
    </div>
  );
}
