"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("dashboard-theme") as Theme;
    if (saved) setTheme(saved);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("dashboard-theme", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div data-theme={theme} style={{
        background: theme === "dark" ? "#141414" : "#fafafa",
        color: theme === "dark" ? "#ededed" : "#171717",
        minHeight: "100vh",
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function tokens(theme: Theme) {
  const dark = theme === "dark";
  return {
    bg:           dark ? "#141414" : "#fafafa",
    surface:      dark ? "#1e1e1e" : "#f2f2f0",
    surfaceHover: dark ? "#252525" : "#ebebea",
    border:       dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    borderHover:  dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    text:         dark ? "#ededed" : "#171717",
    textSub:      dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
    textFaint:    dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)",
    inputBg:      dark ? "#1e1e1e" : "#f2f2f0",
    btnBg:        dark ? "#ededed" : "#171717",
    btnText:      dark ? "#171717" : "#ededed",
    danger:       "#ef4444",
    sidebarBg:    dark ? "#0e0e0e" : "#f2f2f0",
  };
}

export function inputStyle(t: ReturnType<typeof tokens>) {
  return {
    background: t.inputBg,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s",
  } as React.CSSProperties;
}

export function btnPrimary(t: ReturnType<typeof tokens>) {
  return {
    background: t.btnBg,
    color: t.btnText,
    borderRadius: "10px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: 500,
    width: "100%",
    cursor: "pointer",
    border: "none",
    transition: "opacity 0.15s",
  } as React.CSSProperties;
}