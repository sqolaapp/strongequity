import type { Currency, EntryRow } from "@/lib/ketahanan";
import { CURRENCY_LABEL, fmtLot, fmtMoney, fmtMoneySigned } from "@/lib/ketahanan";

interface EntriesTableProps {
  rows: EntryRow[];
  entries: number;
  lossEntries: number;
  onLossEntriesChange: (value: number) => void;
  currency: Currency;
  onCurrencyChange: (value: Currency) => void;
  kurs: number;
}

export function EntriesTable({
  rows,
  entries,
  lossEntries,
  onLossEntriesChange,
  currency,
  onCurrencyChange,
  kurs,
}: EntriesTableProps) {
  const unit = currency === "cent" ? "¢" : currency === "usd" ? "$" : "Rp";

  return (
    <section aria-label="Rincian per entry" className="brutal bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border px-3 py-2">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
          Rincian per Entry
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Entry Loss
            </span>
            <input
              type="number"
              min={0}
              max={entries}
              value={lossEntries}
              onChange={(e) =>
                onLossEntriesChange(
                  Math.max(0, Math.min(entries, Math.round(Number(e.target.value) || 0))),
                )
              }
              className="brutal w-14 bg-background px-1.5 py-1 text-right font-mono text-[10px] font-bold text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Mata uang
            </span>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              className="brutal min-w-0 w-auto max-w-[6.5rem] bg-background px-1.5 py-1 font-mono text-[10px] font-bold text-foreground outline-none"
            >
              {(Object.keys(CURRENCY_LABEL) as Currency[]).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-right font-mono text-[10px] sm:text-xs">
          <thead className="bg-secondary">
            <tr className="border-b-2 border-border font-display text-[9px] uppercase tracking-widest text-muted-foreground">
              <th className="px-1.5 py-1 text-left font-bold">#</th>
              <th className="px-1.5 py-1 font-bold">Lot</th>
              <th className="px-1.5 py-1 font-bold">P/L {unit}</th>
              <th className="px-1.5 py-1 font-bold">Akum {unit}</th>
              <th className="px-1.5 py-1 font-bold">Sisa {unit}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.index}
                className={`border-b border-border/40 last:border-0 ${
                  row.blown
                    ? "bg-destructive/15"
                    : row.status === "profit"
                      ? "bg-primary/10"
                      : row.status === "bep"
                        ? "bg-accent/40"
                        : ""
                }`}
              >
                <td className="px-1.5 py-0.5 text-left text-muted-foreground">
                  {row.index}
                  <span
                    className={`ml-1 font-display text-[8px] font-bold uppercase ${
                      row.status === "profit"
                        ? "text-primary"
                        : row.status === "bep"
                          ? "text-muted-foreground"
                          : "text-destructive"
                    }`}
                  >
                    {row.status === "profit" ? "TP" : row.status === "bep" ? "BEP" : "L"}
                  </span>
                </td>
                <td className="px-1.5 py-0.5 text-foreground">{fmtLot(row.lot)}</td>
                <td
                  className={`px-1.5 py-0.5 ${
                    row.status === "profit"
                      ? "text-primary"
                      : row.status === "bep"
                        ? "text-muted-foreground"
                        : "text-destructive"
                  }`}
                >
                  {row.status === "bep"
                    ? "0"
                    : `${row.plCent >= 0 ? "+" : "-"}${fmtMoney(row.plCent, currency, kurs)}`}
                </td>
                <td
                  className={`px-1.5 py-0.5 ${
                    row.cumPlCent >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {row.cumPlCent >= 0 ? "+" : "-"}
                  {fmtMoney(row.cumPlCent, currency, kurs)}
                </td>
                <td
                  className={`px-1.5 py-0.5 font-bold ${
                    row.equityLeftUsd < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {fmtMoneySigned(row.equityLeftUsd * 100, currency, kurs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
