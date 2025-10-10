import React, { createContext, useContext } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  // optional toggle if you add theme switching later
  toggleTheme?: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => {
  const toggleTheme = () => {
    /* noop - implement if you add runtime toggle */
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}