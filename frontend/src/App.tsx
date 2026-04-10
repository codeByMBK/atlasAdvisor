import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage.js";
import { AnalysePage } from "./pages/AnalysePage.js";
import { MetricsPage } from "./pages/MetricsPage.js";

function App(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/analyse" element={<AnalysePage />} />
      <Route path="/metrics" element={<MetricsPage />} />
      {/* Legacy redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
