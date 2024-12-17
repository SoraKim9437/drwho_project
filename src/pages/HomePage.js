import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

function HomePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // HomePage.js 수정
  const handleSearch = () => {
    if (query.trim()) {
      // 쿼리를 URL 파라미터로 전달
      navigate(`/search-results?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-blue-500 mb-8">Dr.WHO</h1>
      <div className="flex w-1/2">
        <input
          type="text"
          placeholder="병명이나 교수에 대해 질문해주세요"
          className="w-full p-4 border border-gray-300 rounded-l-lg focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white p-4 rounded-r-lg hover:bg-blue-600"
        >
          검색
        </button>
      </div>
    </div>
  );
}

export default HomePage;
