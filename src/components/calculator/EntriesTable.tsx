import type { EntryRow } from "@/lib/ketahanan";
import { fmtCent, fmtLot, fmtPips, fmtUsd } from "@/lib/ketahanan";

export function EntriesTable({ rows }: { rows: EntryRow[] }) {
  return (
    <section aria-label="Rincian per entry" className="brutal bg-card">
      <header className="border-b-2 border-border px-3 py-2">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
          Rincian per Entry
        </h2>
      </header>
      <div className="max-h-[380px] overflow-auto">
        <table className="w-full text-right font-mono text-[11px] sm:text-xs">
          <thead className="sticky top-0 bg-secondary">
            <tr className="border-b-2 border-border font-display text-[9px] uppercase tracking-widest text-muted-foreground">
              <th className="px-2 py-2 text-left font-bold">#</th>
              <th className="px-2 py-2 font-bold">Lot</th>
              <th className="px-2 py-2 font-bold">Σ Lot</th>
              <th className="px-2 py-2 font-bold">Pips</th>
              <th className="px-2 py-2 font-bold">Loss ¢</th>
              <th className="px-2 py-2 font-bold">Σ Loss ¢</th>
              <th className="px-2 py-2 font-bold">Sisa $</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.index}
                className={`border-b border-border/40 last:border-0 ${
                  row.blown ? "bg-destructive/15" : ""
                }`}
              >
                <td className="px-2 py-1.5 text-left text-muted-foreground">{row.index}</td>
                <td className="px-2 py-1.5 text-foreground">{fmtLot(row.lot)}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{fmtLot(row.cumLot)}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{fmtPips(row.distancePips)}</td>
                <td className="px-2 py-1.5 text-destructive">-{fmtCent(row.lossCent)}</td>
                <td className="px-2 py-1.5 font-bold text-foreground">
                  -{fmtCent(row.cumLossCent)}
                </td>
                <td
                  className={`px-2 py-1.5 font-bold ${
                    row.equityLeftUsd < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {fmtUsd(row.equityLeftUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
