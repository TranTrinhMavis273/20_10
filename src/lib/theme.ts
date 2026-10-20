import type { CSSProperties } from "react";
import type { Settings } from "./store";

export function themeStyle(s: Settings): CSSProperties {
  return { ["--primary" as string]: s.primaryColor, ["--ring" as string]: s.primaryColor, ["--secondary" as string]: s.accentColor };
}

