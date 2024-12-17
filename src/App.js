import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ProfessorDetailPage from "./pages/ProfessorDetailPage";
import React from "react";
import ResultsPage from "./pages/ResultsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/search-results" element={<ResultsPage />} />
        <Route path="/professor/:id" element={<ProfessorDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
