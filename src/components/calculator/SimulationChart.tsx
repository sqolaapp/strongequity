import { useEffect, useMemo, useRef, useState } from "react";
import type { CalcInput, Currency, SimFrame } from "@/lib/ketahanan";
import { fmtMoney, fmtMoneySigned, fmtPct, fmtPips, simNetCentAt } from "@/lib/ketahanan";

interface SimulationChartProps {
  input: CalcInput;
  frame: SimFrame;
  totalSteps: number;
  step: number;
  playing: boolean;
  currency: Currency;
  kurs: number;
}

const W = 600;
const H = 250;
const PAD = { top: 22, right: 20, bottom: 30, left: 78 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function SimulationChart({
  input,
  frame,
  totalSteps,
  step,
  playing,
  currency,
  kurs,
}: SimulationChartProps) {
  const entries = Math.max(0, Math.round(input.entries));
  const dirSign = input.direction === "buy" ? -1 : 1;

  /** Harga (pip, relatif entry ke-1) pada langkah s. BUY turun, SELL naik. */
  const priceAt = useMemo(() => {
    return (s: number) => {
      const adverse = s <= entries ? Math.max(0, s - 1) : Math.max(0, 2 * entries - 1 - s);
      return dirSign * adverse * input.point;
    };
  }, [entries, dirSign, input.point]);

  const history = useMemo(
    () => Array.from({ length: totalSteps + 1 }, (_, s) => simNetCentAt(input, s)),
    [input, totalSteps],
  );

  // ---- animasi halus: progress mengejar step secara bertahap (bukan lompat) ----
  const [progress, setProgress] = useState(step);
  const progressRef = useRef(step);
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Snap langsung kalau user minta gerak minimal, atau kalau jaraknya jauh
    // (tekan Reset / kembali dari tab lain) — biar tidak meluncur panjang.
    if (reduced || Math.abs(step - progressRef.current) > 2) {
      progressRef.current = step;
      setProgress(step);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      const diff = step - progressRef.current;
      if (Math.abs(diff) < 0.004) {
        progressRef.current = step;
        setProgress(step);
        return;
      }
      progressRef.current += diff * Math.min(1, dt * 2.6);
      setProgress(progressRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const p = Math.max(0, Math.min(totalSteps, progress));
  const full = Math.floor(p);
  const frac = p - full;

  const extremePrice = priceAt(entries);
  const lo = Math.min(0, extremePrice);
  const hi = Math.max(0, extremePrice);
  const padY = Math.max(1, (hi - lo) * 0.12);
  const yMin = lo - padY;
  const yMax = hi + padY;

  const xAt = (s: number) => PAD.left + (s / Math.max(1, totalSteps)) * PLOT_W;
  const yAt = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * PLOT_H;

  // Harga saat P/L menyentuh nol (BEP) — dihitung dari titik silang riwayat.
  const bepPrice = useMemo(() => {
    for (let i = 1; i < history.length; i++) {
      const a = history[i - 1] ?? 0;
      const b = history[i] ?? 0;
      if (a < 0 && b >= 0) {
        const t = (0 - a) / (b - a);
        return priceAt(i - 1) + (priceAt(i) - priceAt(i - 1)) * t;
      }
    }
    return null;
  }, [history, priceAt]);

  const nodes: { x: number; y: number; net: number }[] = [];
  for (let s = 0; s <= full; s++) {
    nodes.push({ x: xAt(s), y: yAt(priceAt(s)), net: history[s] ?? 0 });
  }
  if (frac > 0 && full < totalSteps) {
    const a = history[full] ?? 0;
    const b = history[full + 1] ?? 0;
    nodes.push({
      x: xAt(full + frac),
      y: yAt(priceAt(full) + (priceAt(full + 1) - priceAt(full)) * frac),
      net: a + (b - a) * frac,
    });
  }

  // Garis dipecah: merah selama P/L masih minus, hijau setelah lewat BEP.
  const crossIdx = nodes.findIndex((nd, i) => i > 0 && nd.net >= 0 && (nodes[i - 1]?.net ?? 0) < 0);
  const splitAt = crossIdx === -1 ? nodes.length : crossIdx;
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.length < 2 ? "" : pts.map((q, i) => `${i === 0 ? "M" : "L"}${q.x} ${q.y}`).join(" ");
  const lossPath = toPath(nodes.slice(0, splitAt + 1));
  const profitPath = toPath(nodes.slice(splitAt));

  const last = nodes.at(-1);
  const currentCent = last?.net ?? 0;
  const drawdownPct =
    input.modalUsd > 0 ? Math.max(0, (-currentCent / 100 / input.modalUsd) * 100) : 0;

  const stage =
    frame.phase === "idle" ? 0 : frame.phase === "loss" ? 1 : frame.phase === "bottom" ? 2 : 3;
  const stages = ["Buka entry", "Titik terjauh", "Harga berbalik"];

  const dividerX = xAt(entries);
  const showDivider = totalSteps > entries;
  const retracePips = bepPrice === null ? null : Math.abs(extremePrice - bepPrice);

  return (
    <div className="border-t-2 border-border px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Grafik harga · {input.direction === "buy" ? "harga turun dulu" : "harga naik dulu"}
        </span>
        <div className="flex items-center gap-3 font-display text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
          <Legend className="bg-destructive" label="Floating loss" />
          <Legend className="bg-primary" label="Profit" />
        </div>
      </div>

      {/* Stepper tahapan: user langsung tahu sedang di fase mana */}
      <ol className="mt-2.5 flex gap-1.5">
        {stages.map((s, i) => {
          const active = stage === i + 1;
          const done = stage > i + 1;
          return (
            <li
              key={s}
              className={`brutal flex-1 px-1.5 py-1 text-center font-display text-[8px] font-bold uppercase tracking-widest transition-colors duration-500 ${
                active
                  ? frame.blown
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-accent text-accent-foreground"
                  : done
                    ? "bg-primary/25 text-foreground"
                    : "bg-background text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </li>
          );
        })}
      </ol>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label="Grafik pergerakan harga simulasi"
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={PLOT_W}
          height={PLOT_H}
          className="fill-muted/40 stroke-border"
          strokeWidth={2}
        />

        {/* garis acuan + label pip di gutter kiri (tidak menimpa grafik) */}
        <Guide y={yAt(0)} label="0" caption="harga awal" tone="muted" />
        {bepPrice !== null ? (
          <Guide
            y={yAt(bepPrice)}
            label={fmtPips(Math.abs(bepPrice))}
            caption="BEP"
            tone="primary"
          />
        ) : null}
        {extremePrice !== 0 ? (
          <Guide
            y={yAt(extremePrice)}
            label={fmtPips(Math.abs(extremePrice))}
            caption="terjauh"
            tone="danger"
          />
        ) : null}

        {showDivider ? (
          <line
            x1={dividerX}
            y1={PAD.top}
            x2={dividerX}
            y2={PAD.top + PLOT_H}
            className="stroke-foreground/30"
            strokeWidth={1.5}
            strokeDasharray="4 5"
          />
        ) : null}

        {lossPath ? (
          <path d={lossPath} className="stroke-destructive" strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        ) : null}
        {profitPath ? (
          <path d={profitPath} className="stroke-primary" strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        ) : null}

        {/* titik tiap entry yang sudah dibuka */}
        {entries <= 40
          ? nodes
              .slice(1, Math.min(nodes.length, entries + 1))
              .map((nd, i) => <circle key={i} cx={nd.x} cy={nd.y} r={2.5} className="fill-destructive" />)
          : null}

        {last ? (
          <>
            {playing ? (
              <circle cx={last.x} cy={last.y} r={4} className="fill-foreground/40">
                <animate attributeName="r" values="4;11;4" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.45;0;0.45" dur="2.2s" repeatCount="indefinite" />
              </circle>
            ) : null}
            <circle
              cx={last.x}
              cy={last.y}
              r={4.5}
              className={`${currentCent >= 0 ? "fill-primary" : "fill-destructive"} stroke-foreground`}
              strokeWidth={1.5}
            />
            <text
              x={Math.min(last.x + 9, W - PAD.right - 90)}
              y={last.y < PAD.top + PLOT_H / 2 ? last.y + 17 : last.y - 10}
              className={`${currentCent >= 0 ? "fill-primary" : "fill-destructive"} font-mono font-bold`}
              fontSize={12}
            >
              {fmtMoneySigned(currentCent, currency, kurs)}
            </text>
          </>
        ) : null}

        <text x={PAD.left} y={H - 9} className="fill-muted-foreground font-mono" fontSize={9}>
          entry 1
        </text>
        {showDivider && dividerX < PAD.left + PLOT_W * 0.72 ? (
          <text x={dividerX} y={H - 9} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize={9}>
            harga berbalik
          </text>
        ) : null}
        <text
          x={PAD.left + PLOT_W}
          y={H - 9}
          textAnchor="end"
          className="fill-muted-foreground font-mono"
          fontSize={9}
        >
          selesai
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-display text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Sumbu Y = harga (pip)</span>
        <span>Terjauh {fmtPips(Math.abs(extremePrice))} pip</span>
        {retracePips !== null ? <span>BEP = balik {fmtPips(retracePips)} pip</span> : null}
      </div>

      <p className="mt-1.5 min-h-[2.4em] text-[10px] leading-snug text-muted-foreground soft-swap">
        {frame.phase === "idle"
          ? `Tekan Mulai: harga bergerak ${input.direction === "buy" ? "turun" : "naik"} melewati ${entries} entry (floating loss menumpuk), lalu berbalik menutup loss jadi profit.`
          : frame.blown
            ? `Modal habis di entry #${frame.opened}: floating loss ${fmtMoney(currentCent, currency, kurs)} sudah melewati modal (${fmtPct(drawdownPct)}).`
            : frame.phase === "loss"
              ? `Entry #${frame.opened} dari ${entries} masuk pada jarak ${fmtPips(Math.abs(priceAt(frame.opened)))} pip. P/L ${fmtMoneySigned(currentCent, currency, kurs)} — ${fmtPct(drawdownPct)} dari modal terpakai.`
              : frame.phase === "bottom"
                ? `Semua ${entries} entry terbuka di titik terjauh ${fmtPips(Math.abs(extremePrice))} pip: floating loss maksimum ${fmtMoney(currentCent, currency, kurs)} (${fmtPct(drawdownPct)} dari modal).`
                : frame.phase === "recover"
                  ? `Harga berbalik ${frame.retrace} grid. P/L sekarang ${fmtMoneySigned(currentCent, currency, kurs)}.`
                  : `Selesai: harga berbalik ${frame.retrace} grid, hasil akhir ${fmtMoneySigned(currentCent, currency, kurs)}.`}
      </p>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block size-2 border-2 border-border ${className}`} />
      {label}
    </span>
  );
}

function Guide({
  y,
  label,
  caption,
  tone,
}: {
  y: number;
  label: string;
  caption: string;
  tone: "muted" | "danger" | "primary";
}) {
  const stroke =
    tone === "danger"
      ? "stroke-destructive/55"
      : tone === "primary"
        ? "stroke-primary/60"
        : "stroke-foreground/30";
  const fill =
    tone === "danger" ? "fill-destructive" : tone === "primary" ? "fill-primary" : "fill-muted-foreground";
  return (
    <>
      <line
        x1={PAD.left}
        y1={y}
        x2={PAD.left + PLOT_W}
        y2={y}
        className={stroke}
        strokeWidth={1.5}
        strokeDasharray="5 5"
      />
      <text x={PAD.left - 9} y={y + 1} textAnchor="end" className={`${fill} font-mono font-bold`} fontSize={11}>
        {label}
      </text>
      <text x={PAD.left - 9} y={y + 11} textAnchor="end" className="fill-muted-foreground font-mono" fontSize={8}>
        {caption}
      </text>
    </>
  );
}
