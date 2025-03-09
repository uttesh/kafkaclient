import React from "react";
import logo from "./logo.svg";
import "./App.css";
import KafkaClient from "./KafkaClient";
import { ThemeProviderWrapper, useTheme } from "./context/ThemeContext";

function App() {
  return (
    <div className="App">
      <ThemeProviderWrapper>
        <KafkaClient />
      </ThemeProviderWrapper>
    </div>
  );
}

export default App;
