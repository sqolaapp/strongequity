import type { CalcResult, Currency } from "@/lib/ketahanan";
import { fmtLot, fmtMoney, fmtMoneySigned, fmtPct, fmtPips } from "@/lib/ketahanan";

interface SummaryCardsProps {
  result: CalcResult;
  entries: number;
  currency: Currency;
  kurs: number;
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

export function SummaryCards({ result, entries, currency, kurs }: SummaryCardsProps) {
  const tone = riskTone(result.riskPct);
  const survived = result.blownAtEntry === null;
  const signed = (cent: number) => fmtMoneySigned(cent, currency, kurs);

  return (
    <section aria-label="Ringkasan hasil" className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard
          label="Net Profit/Loss"
          value={signed(result.totalCent)}
          tone={result.totalCent >= 0 ? "primary" : "danger"}
        />
        <StatCard
          label="Total Loss"
          value={fmtMoney(result.totalLossCent, currency, kurs)}
          suffix={result.lossEntries > 0 ? `${result.lossEntries} entry` : undefined}
          tone="danger"
        />
        <StatCard
          label="Total Profit"
          value={fmtMoney(result.totalProfitCent, currency, kurs)}
          suffix={result.profitEntries > 0 ? `${result.profitEntries} entry` : undefined}
          tone="primary"
        />
        <StatCard
          label="Pertumbuhan %"
          value={fmtPct(result.netProfitPct)}
          tone={result.netProfitPct >= 0 ? "primary" : "danger"}
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
                {signed(result.totalLossCent)}
              </span>
              , disarankan{" "}
              <span className="font-mono font-bold text-foreground">
                {signed(result.requiredUsd * 100)}
              </span>{" "}
              dengan tambahan buffer 20%.
            </>
          ) : (
            <>
              Modal habis di{" "}
              <span className="font-mono font-bold text-destructive">
                entry #{result.blownAtEntry}
              </span>{" "}
              — hanya {result.survivedEntries} entry yang tertahan. Butuh minimal{" "}
              <span className="font-mono font-bold text-foreground">
                {signed(result.requiredUsd * 100)}
              </span>
              .
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="brutal bg-card p-2.5">
          <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Total / Akhir Lot
          </p>
          <div className="mt-0.5 flex items-baseline gap-1.5 font-mono text-sm font-bold text-foreground sm:text-base">
            <span>{fmtLot(result.totalLot)}</span>
            <span className="text-[10px] text-muted-foreground">/</span>
            <span>{fmtLot(result.worstLot)}</span>
          </div>
        </div>
        <StatCard
          label="Tahan 1 entry"
          value={`${fmtPips(result.maxDistanceFirstEntryPips)} pips`}
        />
        <StatCard
          label="Sisa equity"
          value={signed(result.equityLeftUsd * 100)}
          tone={result.equityLeftUsd < 0 ? "danger" : "plain"}
        />
      </div>
    </section>
  );
}
