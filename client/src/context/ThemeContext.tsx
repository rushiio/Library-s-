import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  isDyslexicFont: boolean;
  toggleDyslexicFont: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('libra_theme') === 'dark' ||
      (!localStorage.getItem('libra_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('libra_contrast') === 'high';
  });

  const [isDyslexicFont, setIsDyslexicFont] = useState<boolean>(() => {
    return localStorage.getItem('libra_dyslexic') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('libra_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('libra_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
      localStorage.setItem('libra_contrast', 'high');
    } else {
      root.classList.remove('high-contrast');
      localStorage.setItem('libra_contrast', 'normal');
    }
  }, [isHighContrast]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDyslexicFont) {
      root.classList.add('font-dyslexic');
      localStorage.setItem('libra_dyslexic', 'true');
    } else {
      root.classList.remove('font-dyslexic');
      localStorage.setItem('libra_dyslexic', 'false');
    }
  }, [isDyslexicFont]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const toggleHighContrast = () => setIsHighContrast((prev) => !prev);
  const toggleDyslexicFont = () => setIsDyslexicFont((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        isHighContrast,
        toggleHighContrast,
        isDyslexicFont,
        toggleDyslexicFont,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
