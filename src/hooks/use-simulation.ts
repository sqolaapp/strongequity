import { useEffect, useState } from "react";

export function useSimulation(total: number) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(600);

  // Reset kalau jumlah entry / hasil berubah.
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [total]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.max(50, speedMs),
    );
    return () => window.clearTimeout(t);
  }, [playing, step, total, speedMs]);

  const toggle = () => {
    if (step >= total) setStep(0);
    setPlaying((p) => !p);
  };

  const reset = () => {
    setPlaying(false);
    setStep(0);
  };

  return { step, playing, speedMs, setSpeedMs, toggle, reset, running: playing || step > 0 };
}
