import React, { createContext, useContext } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider can accept an externally-managed toggleTheme (from App)
export const ThemeProvider: React.FC<{
  theme: Theme;
  toggleTheme?: () => void;
  children: React.ReactNode;
}> = ({ theme, toggleTheme, children }) => {
  const toggle = toggleTheme ?? (() => {});
  return <ThemeContext.Provider value={{ theme, toggleTheme: toggle }}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}