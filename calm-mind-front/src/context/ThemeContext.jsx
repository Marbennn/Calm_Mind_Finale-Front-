import { createContext, useState, useEffect } from 'react';
export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('cm-theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('cm-theme', theme); } catch { /* ignore */ }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('cm-dark', theme === 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};