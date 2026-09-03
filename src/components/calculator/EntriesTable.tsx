import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Currency, EntryRow } from "@/lib/ketahanan";
import { CURRENCY_LABEL, fmtLot, fmtMoney, fmtMoneySigned } from "@/lib/ketahanan";

const selectTriggerClass =
  "brutal h-auto rounded-none border-2 bg-background px-1.5 py-1 font-mono text-[10px] font-bold text-foreground shadow-none focus:ring-0 [&_svg]:size-3 [&_svg]:opacity-100";
const selectContentClass = "rounded-none border-2 border-border font-mono";
const selectItemClass = "rounded-none py-1 pl-2 text-[10px] font-bold focus:bg-accent focus:text-accent-foreground";

interface EntriesTableProps {
  rows: EntryRow[];
  entries: number;
  lossEntries: number;
  onLossEntriesChange: (value: number) => void;
  currency: Currency;
  onCurrencyChange: (value: Currency) => void;
  kurs: number;
  simNote?: string | undefined;
}

export function EntriesTable({
  rows,
  entries,
  lossEntries,
  onLossEntriesChange,
  currency,
  onCurrencyChange,
  kurs,
  simNote,
}: EntriesTableProps) {
  const shownRows = rows;
  const unit = currency === "cent" ? "¢" : currency === "usd" ? "$" : "Rp";
  const lossOptions = Array.from({ length: Math.max(0, entries) + 1 }, (_, i) => i);

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
            <Select value={String(lossEntries)} onValueChange={(v) => onLossEntriesChange(Number(v))}>
              <SelectTrigger className={`${selectTriggerClass} w-16`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {lossOptions.map((n) => (
                  <SelectItem key={n} value={String(n)} className={selectItemClass}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Mata uang
            </span>
            <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
              <SelectTrigger className={`${selectTriggerClass} w-auto min-w-0 max-w-[6.5rem]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {(Object.keys(CURRENCY_LABEL) as Currency[]).map((c) => (
                  <SelectItem key={c} value={c} className={selectItemClass}>
                    {CURRENCY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {shownRows.map((row, i) => (
              <tr
                key={row.index}
                style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
                className={`anim-row-in border-b border-border/40 transition-colors duration-300 last:border-0 ${
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
        {simNote ? (
          <p
            key={simNote}
            className="anim-row-in border-t-2 border-border px-3 py-1.5 text-left font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground"
          >

            {simNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}
