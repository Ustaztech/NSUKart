"use client";
import { Moon, Sun } from "lucide-react";
export function ThemeToggle() {
  function change() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("nsukart-theme", next); } catch { /* Storage may be unavailable */ }
  }
  return <button type="button" onClick={change} className="theme-toggle" aria-label="Toggle light and dark mode" title="Toggle colour mode">
    <Moon className="theme-moon" size={20} />
    <Sun className="theme-sun" size={20} />
  </button>;
}
