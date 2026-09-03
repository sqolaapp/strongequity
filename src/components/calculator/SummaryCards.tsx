import type { CalcResult, Currency } from "@/lib/ketahanan";
import { fmtLot, fmtMoney, fmtMoneySigned, fmtPct, fmtPips } from "@/lib/ketahanan";

interface SummaryCardsProps {
  result: CalcResult;
  entries: number;
  currency: Currency;
  kurs: number;
  lossEntries: number;
}

function riskTone(pct: number): { label: string; className: string } {
  if (pct <= 30) return { label: "AMAN", className: "bg-primary text-primary-foreground" };
  if (pct <= 70) return { label: "WASPADA", className: "bg-accent text-accent-foreground" };
  if (pct <= 100) return { label: "KRITIS", className: "bg-accent text-accent-foreground" };
  return { label: "MC / BLOWN", className: "bg-destructive text-destructive-foreground" };
}

function Row({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string;
  tone?: "plain" | "primary" | "danger";
}) {
  const fg =
    tone === "primary"
      ? "text-primary"
      : tone === "danger"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="flex items-baseline justify-between gap-3 border-b-2 border-foreground/10 px-3 py-2 transition-colors duration-300 last:border-b-0">
      <p className="text-[11px] leading-snug text-muted-foreground">{label}</p>
      <p className={`shrink-0 font-mono text-xs font-bold sm:text-sm ${fg}`}>
        <span key={value} className="anim-value">
          {value}
        </span>
      </p>
    </div>
  );
}


export function SummaryCards({
  result,
  entries,
  currency,
  kurs,
  lossEntries,
}: SummaryCardsProps) {
  const tone = riskTone(result.riskPct);
  const survived = result.blownAtEntry === null;
  const money = (cent: number) => fmtMoney(cent, currency, kurs);
  const signed = (cent: number) => fmtMoneySigned(cent, currency, kurs);

  return (
    <section aria-label="Ringkasan hasil" className="flex flex-col gap-2.5">
      <div className="brutal bg-card">
        <div className="flex items-center justify-between gap-2 border-b-2 border-foreground px-3 py-2">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
            Ringkasan
          </h2>
          <span
            className={`brutal px-2 py-0.5 font-display text-[9px] font-bold tracking-widest ${tone.className}`}
          >
            {tone.label}
          </span>
        </div>

        <Row
          label={`Modal pas menahan floating maksimum (semua ${entries} entry terbuka)`}
          value={money(result.peakLossCent)}
          tone={survived ? "primary" : "plain"}
        />
        <Row
          label={`Total loss (${result.lossEntries} entry)`}
          value={money(result.totalLossCent)}
          tone="danger"
        />
        <Row
          label={`Total profit (${result.profitEntries} entry)`}
          value={money(result.totalProfitCent)}
          tone="primary"
        />
        <Row
          label="Net profit / loss"
          value={signed(result.totalCent)}
          tone={result.totalCent >= 0 ? "primary" : "danger"}
        />
        <Row
          label="Pertumbuhan terhadap modal"
          value={fmtPct(result.netProfitPct)}
          tone={result.netProfitPct >= 0 ? "primary" : "danger"}
        />
        <Row
          label="Risiko floating terhadap modal"
          value={fmtPct(result.riskPct)}
          tone={result.riskPct > 70 ? "danger" : "plain"}
        />
        <Row label="Total lot / lot entry terakhir" value={`${fmtLot(result.totalLot)} / ${fmtLot(result.worstLot)}`} />
        <Row label="Modal saat ini tahan 1 entry" value={`${fmtPips(result.maxDistanceFirstEntryPips)} pips`} />
        <Row
          label="Sisa equity di titik terburuk"
          value={signed(result.equityLeftUsd * 100)}
          tone={result.equityLeftUsd < 0 ? "danger" : "plain"}
        />
        {survived ? (
          <Row label="Status ketahanan" value={`Modal menahan semua ${entries} entry`} tone="primary" />
        ) : (
          <Row
            label="Status ketahanan"
            value={`MC di entry #${result.blownAtEntry} — tertahan ${result.survivedEntries} entry`}
            tone="danger"
          />
        )}

        <div className="px-3 py-2.5">
          <div className="brutal h-2.5 w-full overflow-hidden bg-muted p-0">
            <div
              className={`h-full transition-all duration-300 ${
                result.riskPct > 100 ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, result.riskPct)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
            Bar = floating loss maksimum dibanding modal Anda saat ini.
          </p>
        </div>
      </div>
    </section>
  );
}
