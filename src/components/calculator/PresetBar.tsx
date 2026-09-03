import { useState } from "react";
import { SAMPLE_PRESETS, type Preset } from "@/hooks/use-presets";
import type { CalcInput } from "@/lib/ketahanan";

interface PresetBarProps {
  presets: Preset[];
  onLoad: (input: CalcInput) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

function PresetChip({
  name,
  onLoad,
  onDelete,
}: {
  name: string;
  onLoad: () => void;
  onDelete?: () => void;
}) {
  return (
    <span className="brutal flex items-center bg-background">
      <button
        type="button"
        onClick={onLoad}
        className="px-2 py-1 font-mono text-[11px] font-bold text-foreground hover:bg-primary/30"
      >
        {name}
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Hapus preset ${name}`}
          className="border-l-2 border-border px-1.5 py-1 font-display text-[11px] font-bold text-destructive hover:bg-destructive/20"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function PresetBar({ presets, onLoad, onSave, onDelete }: PresetBarProps) {
  const [name, setName] = useState("");

  const save = () => {
    onSave(name);
    setName("");
  };

  return (
    <section aria-label="Preset" className="brutal bg-card p-3">
      <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
        Preset
      </h2>

      <div className="mt-2 flex gap-2">
        <input
          value={name}
          placeholder="Nama preset…"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="brutal min-w-0 flex-1 bg-background px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:bg-primary/20"
        />
        <button
          type="button"
          onClick={save}
          className="brutal-press bg-primary px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
        >
          Save
        </button>
      </div>

      {presets.length > 0 ? (
        <div className="mt-2.5">
          <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Tersimpan
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <PresetChip
                key={p.id}
                name={p.name}
                onLoad={() => onLoad(p.input)}
                onDelete={() => onDelete(p.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-2.5">
        <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Contoh untuk dites
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SAMPLE_PRESETS.map((p) => (
            <PresetChip key={p.id} name={p.name} onLoad={() => onLoad(p.input)} />
          ))}
        </div>
      </div>
    </section>
  );
}
