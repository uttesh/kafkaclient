import { createContext, useContext, useEffect, useState } from "react";
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

interface ThemeContextType {
  toggleTheme: () => void;
  darkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProviderWrapper = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const theme: Theme = createTheme({
    palette: { mode: darkMode ? "dark" : "light" },
    shape: { borderRadius: 10 },
    typography: { fontFamily: "Inter, sans-serif", fontSize: 14 }
  });

  return (
    <ThemeContext.Provider value={{ toggleTheme, darkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProviderWrapper");
  }
  return context;
};
