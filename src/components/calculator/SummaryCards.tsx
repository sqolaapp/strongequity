import type { CalcResult } from "@/lib/ketahanan";
import { fmtCent, fmtLot, fmtPct, fmtPips, fmtRp, fmtUsd } from "@/lib/ketahanan";

interface SummaryCardsProps {
  result: CalcResult;
  entries: number;
}

function riskTone(pct: number): { label: string; className: string } {
  if (pct <= 30) return { label: "AMAN", className: "bg-primary text-primary-foreground" };
  if (pct <= 70) return { label: "WASPADA", className: "bg-accent text-accent-foreground" };
  if (pct <= 100) return { label: "KRITIS", className: "bg-accent text-accent-foreground" };
  return { label: "MC / BLOWN", className: "bg-destructive text-destructive-foreground" };
}

export function StatCard({
  label,
  value,
  suffix,
  tone = "plain",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "plain" | "primary" | "danger";
}) {
  const bg =
    tone === "primary" ? "bg-primary" : tone === "danger" ? "bg-destructive" : "bg-card";
  const fg =
    tone === "primary"
      ? "text-primary-foreground"
      : tone === "danger"
        ? "text-destructive-foreground"
        : "text-foreground";
  const labelFg =
    tone === "plain" ? "text-muted-foreground" : `${fg} opacity-80`;

  return (
    <div className={`brutal p-2.5 ${bg}`}>
      <p className={`font-display text-[9px] font-bold uppercase tracking-widest ${labelFg}`}>
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm font-bold sm:text-base ${fg}`}>
        {value}
        {suffix ? <span className="ml-0.5 text-[10px]">{suffix}</span> : null}
      </p>
    </div>
  );
}

export function SummaryCards({ result, entries }: SummaryCardsProps) {
  const tone = riskTone(result.riskPct);
  const survived = result.blownAtEntry === null;

  return (
    <section aria-label="Ringkasan hasil" className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label="Total Cent" value={fmtCent(result.totalCent)} suffix="¢" tone="primary" />
        <StatCard label="Total USD" value={`$ ${fmtUsd(result.totalUsd)}`} />
        <StatCard label="Total Rupiah" value={`Rp ${fmtRp(result.totalRp)}`} />
        <StatCard
          label="Sisa equity"
          value={`$ ${fmtUsd(result.equityLeftUsd)}`}
          tone={result.equityLeftUsd < 0 ? "danger" : "plain"}
        />
      </div>

      <div className="brutal bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Risiko terhadap modal
            </p>
            <p className="font-mono text-xl font-bold text-foreground">{fmtPct(result.riskPct)}</p>
          </div>
          <span
            className={`brutal px-2.5 py-1 font-display text-[10px] font-bold tracking-widest ${tone.className}`}
          >
            {tone.label}
          </span>
        </div>
        <div className="brutal mt-2.5 h-3 w-full overflow-hidden bg-muted p-0">
          <div
            className={`h-full transition-all duration-300 ${
              result.riskPct > 100 ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${Math.min(100, result.riskPct)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {survived ? (
            <>
              Modal Anda menahan semua {entries} entry. Equity minimum:{" "}
              <span className="font-mono font-bold text-foreground">
                $ {fmtUsd(result.totalUsd)}
              </span>
              , disarankan{" "}
              <span className="font-mono font-bold text-foreground">
                $ {fmtUsd(result.requiredUsd)}
              </span>{" "}
              (≈ Rp {fmtRp(result.requiredRp)}) dengan buffer.
            </>
          ) : (
            <>
              Modal habis di{" "}
              <span className="font-mono font-bold text-destructive">
                entry #{result.blownAtEntry}
              </span>{" "}
              — hanya {result.survivedEntries} entry yang tertahan. Butuh minimal{" "}
              <span className="font-mono font-bold text-foreground">
                $ {fmtUsd(result.requiredUsd)}
              </span>{" "}
              (≈ Rp {fmtRp(result.requiredRp)}).
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label="Total lot" value={fmtLot(result.totalLot)} />
        <StatCard label="Lot entry akhir" value={fmtLot(result.worstLot)} />
        <StatCard label="Total jarak" value={`${fmtPips(result.totalDistancePips)} pips`} />
        <StatCard
          label="Tahan 1 entry"
          value={`${fmtPips(result.maxDistanceFirstEntryPips)} pips`}
        />
      </div>
    </section>
  );
}
