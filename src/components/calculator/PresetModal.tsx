import { useState } from "react";
import { SAMPLE_PRESETS, type Preset } from "@/hooks/use-presets";
import type { CalcInput } from "@/lib/ketahanan";

interface PresetModalProps {
  presets: Preset[];
  onLoad: (input: CalcInput) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

export function PresetModal({ presets, onLoad, onSave, onDelete }: PresetModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const close = () => setOpen(false);

  const save = () => {
    if (!name.trim()) return;
    onSave(name);
    setName("");
  };

  const handleLoad = (input: CalcInput) => {
    onLoad(input);
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="brutal-press bg-secondary px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-secondary-foreground"
      >
        Preset
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 sm:items-center sm:pt-0"
          role="dialog"
          aria-modal="true"
          aria-label="Preset"
        >
          <div className="brutal w-full max-w-md bg-card p-4">
            <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                Preset
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="brutal-press px-2 py-0.5 font-display text-xs font-bold text-destructive"
              >
                ×
              </button>
            </div>

            <div className="mt-3 flex gap-2">
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
                className="brutal-press bg-primary px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
              >
                Simpan
              </button>
            </div>

            {presets.length > 0 ? (
              <div className="mt-4">
                <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tersimpan
                </p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {presets.map((p) => (
                    <li key={p.id} className="brutal flex items-center bg-background">
                      <button
                        type="button"
                        onClick={() => handleLoad(p.input)}
                        className="min-w-0 flex-1 truncate px-2 py-1.5 text-left font-mono text-xs font-bold text-foreground hover:bg-primary/20"
                      >
                        {p.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        aria-label={`Hapus preset ${p.name}`}
                        className="border-l-2 border-border px-2 py-1.5 font-display text-xs font-bold text-destructive hover:bg-destructive/20"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4">
              <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Contoh untuk dites
              </p>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {SAMPLE_PRESETS.map((p) => (
                  <li key={p.id} className="brutal bg-background">
                    <button
                      type="button"
                      onClick={() => handleLoad(p.input)}
                      className="w-full px-2 py-1.5 text-left font-mono text-xs font-bold text-foreground hover:bg-primary/20"
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
