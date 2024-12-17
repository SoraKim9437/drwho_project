import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "/pages/HomePage.js";
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
