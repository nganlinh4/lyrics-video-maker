import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define theme types and interface
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define our theme variables
export const lightTheme = {
  backgroundColor: '#f8f9fa',
  cardBackground: '#ffffff',
  textColor: '#333333',
  headingColor: '#222222',
  borderColor: 'rgba(0, 0, 0, 0.1)',
  accentColor: '#3f51b5',
  accentColorSecondary: '#7986cb',
  hoverColor: 'rgba(0, 0, 0, 0.03)',
  hoverColorDarker: 'rgba(0, 0, 0, 0.08)',
  disabledColor: '#e0e0e0',
  footerBackground: '#f1f1f1',
  footerText: '#666666',
  sectionHeaderBg: '#fafafa',
  headerGradientStart: '#3f51b5',
  headerGradientEnd: '#7986cb',
  headerText: '#ffffff',
  scrollbarTrack: '#f1f1f1',
  scrollbarThumb: '#c1c1c1',
  scrollbarThumbHover: '#a8a8a8',
  dropdownBackground: '#ffffff',
  inputBackground: '#ffffff',
  inputBorder: '#dddddd',
  infoBackground: 'rgba(25, 118, 210, 0.05)',
  errorColor: '#f44336',
  errorBackground: 'rgba(244, 67, 54, 0.08)',
  successColor: '#4caf50',
  successBackground: 'rgba(76, 175, 80, 0.08)',
  warningColor: '#ff9800',
  warningBackground: 'rgba(255, 152, 0, 0.08)',
};

export const darkTheme = {
  backgroundColor: '#121212',
  cardBackground: '#1e1e1e',
  textColor: '#e0e0e0',
  headingColor: '#ffffff',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  accentColor: '#7986cb',
  accentColorSecondary: '#9fa8da',
  hoverColor: 'rgba(255, 255, 255, 0.05)',
  hoverColorDarker: 'rgba(255, 255, 255, 0.1)',
  disabledColor: '#444444',
  footerBackground: '#181818',
  footerText: '#999999',
  sectionHeaderBg: '#252525',
  headerGradientStart: '#2c387e',
  headerGradientEnd: '#3f51b5',
  headerText: '#ffffff',
  scrollbarTrack: '#1e1e1e',
  scrollbarThumb: '#404040',
  scrollbarThumbHover: '#505050',
  dropdownBackground: '#2d2d2d',
  inputBackground: '#2d2d2d',
  inputBorder: '#444444',
  infoBackground: 'rgba(25, 118, 210, 0.1)',
  errorColor: '#f44336',
  errorBackground: 'rgba(244, 67, 54, 0.15)',
  successColor: '#4caf50',
  successBackground: 'rgba(76, 175, 80, 0.15)',
  warningColor: '#ff9800',
  warningBackground: 'rgba(255, 152, 0, 0.15)',
};

// CSS variable generation function
export const generateCSSVariables = (theme: ThemeMode) => {
  const themeObj = theme === 'light' ? lightTheme : darkTheme;
  
  document.documentElement.style.setProperty('--background-color', themeObj.backgroundColor);
  document.documentElement.style.setProperty('--card-background', themeObj.cardBackground);
  document.documentElement.style.setProperty('--text-color', themeObj.textColor);
  document.documentElement.style.setProperty('--heading-color', themeObj.headingColor);
  document.documentElement.style.setProperty('--border-color', themeObj.borderColor);
  document.documentElement.style.setProperty('--accent-color', themeObj.accentColor);
  document.documentElement.style.setProperty('--accent-color-secondary', themeObj.accentColorSecondary);
  document.documentElement.style.setProperty('--hover-color', themeObj.hoverColor);
  document.documentElement.style.setProperty('--hover-color-darker', themeObj.hoverColorDarker);
  document.documentElement.style.setProperty('--disabled-color', themeObj.disabledColor);
  document.documentElement.style.setProperty('--footer-background', themeObj.footerBackground);
  document.documentElement.style.setProperty('--footer-text', themeObj.footerText);
  document.documentElement.style.setProperty('--section-header-bg', themeObj.sectionHeaderBg);
  document.documentElement.style.setProperty('--header-gradient-start', themeObj.headerGradientStart);
  document.documentElement.style.setProperty('--header-gradient-end', themeObj.headerGradientEnd);
  document.documentElement.style.setProperty('--header-text', themeObj.headerText);
  document.documentElement.style.setProperty('--scrollbar-track', themeObj.scrollbarTrack);
  document.documentElement.style.setProperty('--scrollbar-thumb', themeObj.scrollbarThumb);
  document.documentElement.style.setProperty('--scrollbar-thumb-hover', themeObj.scrollbarThumbHover);
  document.documentElement.style.setProperty('--dropdown-background', themeObj.dropdownBackground);
  document.documentElement.style.setProperty('--input-background', themeObj.inputBackground);
  document.documentElement.style.setProperty('--input-border', themeObj.inputBorder);
  document.documentElement.style.setProperty('--info-background', themeObj.infoBackground);
  document.documentElement.style.setProperty('--error-color', themeObj.errorColor);
  document.documentElement.style.setProperty('--error-background', themeObj.errorBackground);
  document.documentElement.style.setProperty('--success-color', themeObj.successColor);
  document.documentElement.style.setProperty('--success-background', themeObj.successBackground);
  document.documentElement.style.setProperty('--warning-color', themeObj.warningColor);
  document.documentElement.style.setProperty('--warning-background', themeObj.warningBackground);
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as ThemeMode) || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Update localStorage and apply CSS variables when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    generateCSSVariables(theme);
    
    // Apply theme class to body for additional styling options
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export an explicit Consumer for class components
export const ThemeConsumer = ThemeContext.Consumer;