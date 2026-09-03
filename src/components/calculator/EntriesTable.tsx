import type { EntryRow } from "@/lib/ketahanan";
import { fmtCent, fmtLot } from "@/lib/ketahanan";

export function EntriesTable({ rows }: { rows: EntryRow[] }) {
  return (
    <section aria-label="Rincian per entry" className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">
          Rincian Floating Loss per Entry
        </h2>
      </header>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-right font-mono text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Entry</th>
              <th className="px-4 py-2.5 font-medium">Lot</th>
              <th className="px-4 py-2.5 font-medium">Jarak (pips)</th>
              <th className="px-4 py-2.5 font-medium">Floating Loss (¢)</th>
              <th className="px-4 py-2.5 font-medium">Akumulasi (¢)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.index}
                className="border-b border-border/50 last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-2 text-left text-muted-foreground">#{row.index}</td>
                <td className="px-4 py-2 text-foreground">{fmtLot(row.lot)}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {row.distancePips.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2 text-destructive">-{fmtCent(row.lossCent)}</td>
                <td className="px-4 py-2 font-semibold text-foreground">
                  -{fmtCent(row.cumLossCent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
