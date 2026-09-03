import { useEffect, useState } from "react";

const STORAGE_KEY = "ketahanan-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefers =
      saved === "dark" ||
      (saved === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefers);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => {
    setDark((prev) => {
      localStorage.setItem(STORAGE_KEY, prev ? "light" : "dark");
      return !prev;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang atau gelap"
      className="brutal-press bg-accent px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-accent-foreground"
    >
      {dark ? "DARK" : "LIGHT"}
    </button>
  );
}
