import { useEffect, useState } from "react";

const MIN_STEP_DELAY_MS = 1000;
const MAX_STEP_DELAY_MS = 3000;

/** Jeda acak per entry, supaya kemunculan tiap data terasa alami (tidak seragam). */
function randomStepDelay(): number {
  return MIN_STEP_DELAY_MS + Math.random() * (MAX_STEP_DELAY_MS - MIN_STEP_DELAY_MS);
}

export function useSimulation(total: number, resetKey: unknown) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Reset kalau jumlah entry / hasil berubah.
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [total, resetKey]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setStep((s) => Math.min(total, s + 1)), randomStepDelay());
    return () => window.clearTimeout(t);
  }, [playing, step, total]);

  const toggle = () => {
    if (step >= total) setStep(0);
    setPlaying((p) => !p);
  };

  const reset = () => {
    setPlaying(false);
    setStep(0);
  };

  return { step, playing, toggle, reset, running: playing || step > 0 };
}
