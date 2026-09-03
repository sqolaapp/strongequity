import { Bookmark, Check, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { SAMPLE_PRESETS, type Preset } from "@/hooks/use-presets";
import { computeKetahanan, fmtPct, fmtUsd, type CalcInput } from "@/lib/ketahanan";

/** Ringkasan singkat sebuah preset: modal pas + seberapa besar hasil akhirnya. */
function presetInfo(input: CalcInput) {
  const r = computeKetahanan(input);
  const modal = `$${fmtUsd(r.peakLossCent / 100)}`;
  const fullLoss = input.lossEntries >= input.entries;
  const pct = r.netProfitPct;

  if (fullLoss)
    return { modal, label: "TAHAN PENUH", detail: "sisa 0", tone: "bg-secondary text-secondary-foreground" };
  if (Math.abs(pct) < 1)
    return { modal, label: "BEP", detail: fmtPct(pct), tone: "bg-secondary text-secondary-foreground" };
  if (pct < 0)
    return { modal, label: "RUGI", detail: fmtPct(pct), tone: "bg-destructive text-destructive-foreground" };
  if (pct < 10)
    return { modal, label: "KECIL", detail: `+${fmtPct(pct)}`, tone: "bg-secondary text-secondary-foreground" };
  if (pct < 40)
    return { modal, label: "SEDANG", detail: `+${fmtPct(pct)}`, tone: "bg-accent text-accent-foreground" };
  if (pct < 100)
    return { modal, label: "BESAR", detail: `+${fmtPct(pct)}`, tone: "bg-primary text-primary-foreground" };
  return { modal, label: "SANGAT BESAR", detail: `+${fmtPct(pct)}`, tone: "bg-primary text-primary-foreground" };
}

function PresetMeta({ input }: { input: CalcInput }) {
  const info = presetInfo(input);
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 font-display text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
      <span>Modal pas {info.modal}</span>
      <span className={`brutal px-1 py-px ${info.tone}`}>
        {info.label} {info.detail}
      </span>
    </span>
  );
}

interface PresetModalProps {
  presets: Preset[];
  onLoad: (input: CalcInput) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdate: (id: string) => void;
}

export function PresetModal({ presets, onLoad, onSave, onDelete, onRename, onUpdate }: PresetModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  const startEdit = (p: Preset) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const confirmEdit = () => {
    if (!editingId) return;
    onRename(editingId, editName);
    cancelEdit();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka preset"
        title="Preset"
        className="brutal-press bg-secondary p-1.5 text-secondary-foreground"
      >
        <Bookmark className="size-4" strokeWidth={2.5} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 sm:items-center sm:pt-0"
          role="dialog"
          aria-modal="true"
          aria-label="Preset"
        >
          <div className="brutal flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto bg-card p-4">
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
                  {presets.map((p) =>
                    editingId === p.id ? (
                      <li key={p.id} className="brutal flex items-center gap-1 bg-background p-1">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="min-w-0 flex-1 bg-background px-1.5 py-1.5 font-mono text-xs text-foreground outline-none"
                        />
                        <button
                          type="button"
                          onClick={confirmEdit}
                          aria-label={`Simpan nama preset ${p.name}`}
                          className="brutal-press bg-primary p-2 text-primary-foreground"
                        >
                          <Check className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          aria-label="Batal edit nama"
                          className="brutal-press bg-secondary p-2 text-secondary-foreground"
                        >
                          <X className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </li>
                    ) : (
                      <li key={p.id} className="brutal flex items-center bg-background">
                        <button
                          type="button"
                          onClick={() => handleLoad(p.input)}
                          className="flex min-w-0 flex-1 flex-col px-2 py-1.5 text-left hover:bg-primary/20"
                        >
                          <span className="truncate font-mono text-xs font-bold text-foreground">{p.name}</span>
                          <PresetMeta input={p.input} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdate(p.id)}
                          aria-label={`Perbarui preset ${p.name} dengan input saat ini`}
                          title="Timpa dengan input saat ini"
                          className="border-l-2 border-border p-2 text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
                        >
                          <Save className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          aria-label={`Ubah nama preset ${p.name}`}
                          title="Ubah nama"
                          className="border-l-2 border-border p-2 text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
                        >
                          <Pencil className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          aria-label={`Hapus preset ${p.name}`}
                          title="Hapus"
                          className="border-l-2 border-border p-2 text-destructive hover:bg-destructive/20"
                        >
                          <X className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}

            <div className="mt-4">
              <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Contoh untuk dites — modal sudah pas
              </p>
              {[...new Set(SAMPLE_PRESETS.map((p) => p.group))].map((group) => (
                <div key={group} className="mt-2.5">
                  <p className="font-display text-[8px] font-bold uppercase tracking-widest text-foreground/70">
                    {group}
                  </p>
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {SAMPLE_PRESETS.filter((p) => p.group === group).map((p) => (
                      <li key={p.id} className="brutal bg-background">
                        <button
                          type="button"
                          onClick={() => handleLoad(p.input)}
                          className="flex w-full flex-col px-2 py-1.5 text-left hover:bg-primary/20"
                        >
                          <span className="font-mono text-[11px] font-bold text-foreground">{p.name}</span>
                          <PresetMeta input={p.input} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
