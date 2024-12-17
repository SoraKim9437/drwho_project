import { useLocation, useNavigate } from "react-router-dom";

import React from "react";

// 샘플 교수 리스트 데이터 (테스트용)
const sampleData = [
  { id: 1, name: "홍길동", specialty: "폐암", hospital: "서울성모병원" },
  { id: 2, name: "이영희", specialty: "유방암", hospital: "강남성모병원" },
  { id: 3, name: "김철수", specialty: "위암", hospital: "부산대학교병원" },
];

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 검색어 가져오기
  const query = new URLSearchParams(location.search).get("query");

  const handleRowClick = (id) => {
    navigate(`/profile/${id}`); // 교수 상세 페이지로 이동
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* 질문 및 답변 */}
      <h1 className="text-3xl font-bold mb-4">검색 결과</h1>
      <p className="text-lg mb-6">질문: {query}</p>
      <div className="bg-white p-4 rounded shadow mb-8">
        <p>
          {/* GPT 답변 샘플 */}
          여기에 GPT가 답변한 결과를 표시합니다. 예를 들어, "{query}"에 대한
          자세한 설명과 관련 정보가 제공됩니다.
        </p>
      </div>

      {/* 교수 리스트 테이블 */}
      <h2 className="text-2xl font-bold mb-4">관련 교수 리스트</h2>
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-blue-500 text-white">
            <th className="p-3">이름</th>
            <th className="p-3">전문분야</th>
            <th className="p-3">소속 병원</th>
          </tr>
        </thead>
        <tbody>
          {sampleData.map((professor) => (
            <tr
              key={professor.id}
              className="cursor-pointer hover:bg-gray-200"
              onClick={() => handleRowClick(professor.id)}
            >
              <td className="p-3 text-center">{professor.name}</td>
              <td className="p-3 text-center">{professor.specialty}</td>
              <td className="p-3 text-center">{professor.hospital}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultsPage;
