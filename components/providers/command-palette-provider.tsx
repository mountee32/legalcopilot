"use client";

import { ReactNode } from "react";
import { CommandPaletteContext, useCommandPaletteProvider } from "@/lib/hooks/use-command-palette";

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const value = useCommandPaletteProvider();

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}
