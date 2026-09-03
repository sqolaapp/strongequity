import type { CalcResult } from "@/lib/ketahanan";
import { fmtCent, fmtPct, fmtRp, fmtUsd } from "@/lib/ketahanan";

interface SummaryCardsProps {
  result: CalcResult;
  modalUsd: number;
}

function riskTone(pct: number): { label: string; className: string } {
  if (pct <= 30)
    return { label: "AMAN", className: "text-primary border-primary/40 bg-primary/10" };
  if (pct <= 70)
    return { label: "WASPADA", className: "text-accent border-accent/40 bg-accent/10" };
  return { label: "BAHAYA", className: "text-destructive border-destructive/40 bg-destructive/10" };
}

function BigCard({
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
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-card"
      }`}
    >
      <p className="font-display text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-xl font-semibold sm:text-2xl ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
        {suffix ? (
          <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

export function SummaryCards({ result, modalUsd }: SummaryCardsProps) {
  const pct = modalUsd > 0 ? (result.totalUsd / modalUsd) * 100 : 0;
  const tone = riskTone(pct);

  return (
    <section aria-label="Ringkasan hasil" className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BigCard label="Total (Cent)" value={fmtCent(result.totalCent)} suffix="¢" highlight />
        <BigCard label="Total (USD)" value={`$ ${fmtUsd(result.totalUsd)}`} />
        <BigCard label="Total (Rupiah)" value={`Rp ${fmtRp(result.totalRp)}`} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Persen risiko terhadap modal
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">
              {fmtPct(pct)}
            </p>
          </div>
          <span
            className={`rounded-full border px-4 py-1.5 font-display text-xs font-bold tracking-widest ${tone.className}`}
          >
            {tone.label}
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Equity minimum yang harus Anda siapkan agar strategi ini tetap bertahan
          sampai entry terakhir adalah{" "}
          <span className="font-mono font-semibold text-foreground">
            $ {fmtUsd(result.totalUsd)}
          </span>{" "}
          (≈ Rp {fmtRp(result.totalRp)}). Jika modal di bawah angka itu, akun
          berisiko margin call sebelum harga berbalik.
        </p>
      </div>
    </section>
  );
}
