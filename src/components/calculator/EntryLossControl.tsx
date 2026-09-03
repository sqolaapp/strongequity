import { NumberField } from "./NumberField";

interface EntryLossControlProps {
  value: number;
  entries: number;
  onChange: (value: number) => void;
}

export function EntryLossControl({ value, entries, onChange }: EntryLossControlProps) {
  return (
    <section aria-label="Entry loss" className="brutal bg-card p-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
            Entry Loss
          </h2>
          <p className="text-[10px] leading-snug text-muted-foreground">
            Berapa entry yang mengambang loss. Sisanya akan jadi profit saat harga berbalik.
          </p>
        </div>
        <div className="w-full sm:w-40">
          <NumberField
            label="Loss count"
            hint={`Maks ${entries}`}
            value={value}
            onChange={(v) => onChange(Math.max(0, Math.min(entries, Math.round(v))))}
          />
        </div>
      </div>
    </section>
  );
}
