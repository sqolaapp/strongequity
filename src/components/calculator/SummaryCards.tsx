import type { CalcResult } from "@/lib/ketahanan";
import { fmtCent, fmtPct, fmtRp, fmtUsd } from "@/lib/ketahanan";

interface SummaryCardsProps {
  result: CalcResult;
  modalUsd: number;
}

function riskTone(pct: number): { label: string; className: string } {
  if (pct <= 30) return { label: "AMAN", className: "bg-primary text-primary-foreground" };
  if (pct <= 70) return { label: "WASPADA", className: "bg-accent text-accent-foreground" };
  return { label: "BAHAYA", className: "bg-destructive text-destructive-foreground" };
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`brutal p-2.5 ${highlight ? "bg-primary" : "bg-card"}`}>
      <p
        className={`font-display text-[9px] font-bold uppercase tracking-widest ${
          highlight ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 font-mono text-sm font-bold sm:text-base ${
          highlight ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {value}
        {suffix ? <span className="ml-0.5 text-[10px]">{suffix}</span> : null}
      </p>
    </div>
  );
}

export function SummaryCards({ result, modalUsd }: SummaryCardsProps) {
  const pct = modalUsd > 0 ? (result.totalUsd / modalUsd) * 100 : 0;
  const tone = riskTone(pct);

  return (
    <section aria-label="Ringkasan hasil" className="flex flex-col gap-2.5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <StatCard label="Total Cent" value={fmtCent(result.totalCent)} suffix="¢" highlight />
        <StatCard label="Total USD" value={`$ ${fmtUsd(result.totalUsd)}`} />
        <StatCard label="Total Rupiah" value={`Rp ${fmtRp(result.totalRp)}`} />
      </div>

      <div className="brutal bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Risiko terhadap modal
            </p>
            <p className="font-mono text-xl font-bold text-foreground">{fmtPct(pct)}</p>
          </div>
          <span
            className={`brutal px-2.5 py-1 font-display text-[10px] font-bold tracking-widest ${tone.className}`}
          >
            {tone.label}
          </span>
        </div>
        <div className="brutal mt-2.5 h-3 w-full overflow-hidden bg-muted p-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Equity minimum agar bertahan sampai entry terakhir:{" "}
          <span className="font-mono font-bold text-foreground">
            $ {fmtUsd(result.totalUsd)}
          </span>{" "}
          (≈ Rp {fmtRp(result.totalRp)}).
        </p>
      </div>
    </section>
  );
}
