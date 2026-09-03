import { useCallback, useEffect, useRef, useState } from "react";

const ENDPOINT = "https://open.er-api.com/v6/latest/USD";

export interface KursState {
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
}

/** Ambil kurs USD → IDR secara live. Fallback ke nilai yang sudah ada bila gagal. */
export function useKurs(onRate: (rate: number) => void) {
  const [state, setState] = useState<KursState>({
    loading: false,
    error: null,
    updatedAt: null,
  });
  const cb = useRef(onRate);
  cb.current = onRate;

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error("gagal");
      const json = (await res.json()) as {
        rates?: Record<string, number>;
        time_last_update_utc?: string;
      };
      const rate = json.rates?.["IDR"];
      if (!rate || !Number.isFinite(rate)) throw new Error("kurs tidak ditemukan");
      cb.current(Math.round(rate * 100) / 100);
      setState({
        loading: false,
        error: null,
        updatedAt: json.time_last_update_utc ?? new Date().toUTCString(),
      });
    } catch {
      setState({ loading: false, error: "Kurs live gagal dimuat", updatedAt: null });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
