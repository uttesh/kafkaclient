import { IconButton } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useTheme } from "./context/ThemeContext";

export const ThemeToggle = () => {
  const { toggleTheme, darkMode } = useTheme();

  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};
