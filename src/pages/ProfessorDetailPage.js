import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import axios from "axios";

function ProfessorDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [professor, setProfessor] = useState(null);  // null로 초기화
  const [keywords, setKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);  // 로딩 상태 추가
  const query = new URLSearchParams(location.search).get("query");

  useEffect(() => {
    const fetchProfessor = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`http://127.0.0.1:8000/api/professors/${id}`);
        const data = response.data;

        // 학력 및 경력 정렬 처리
        const sortedEducation = data.Education_Parsed 
          ? data.Education_Parsed.split(",")
              .map(edu => edu.trim())
              .filter(edu => edu.length > 0)
              .sort((a, b) => extractYear(a) - extractYear(b))
          : [];

        const sortedExperience = data.Experience_Parsed
          ? data.Experience_Parsed.split(",")
              .map(exp => exp.trim())
              .filter(exp => exp.length > 0)
              .sort((a, b) => extractYear(a) - extractYear(b))
          : [];

        // 키워드 안전 처리
        const parsedKeywords = Array.isArray(data.keywords)
          ? data.keywords
          : typeof data.keywords === "string"
          ? data.keywords.split(",").map((keyword) => keyword.trim()).filter(k => k.length > 0)
          : [];

        setProfessor({
          ...data,
          Education_Parsed: sortedEducation,
          Experience_Parsed: sortedExperience,
        });
        setKeywords(parsedKeywords);
      } catch (error) {
        console.error("Error fetching professor data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfessor();
  }, [id]);

  const extractYear = (text) => {
    const match = text?.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 0;
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!professor) {
    return <div className="p-8">교수 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* 최상단: 사용자 질문 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-700">
          질문: <span className="text-blue-500">{query || "N/A"}</span>
        </h1>
      </div>

      {/* 상단: 정량 지표 */}
      <div className="flex gap-4 mb-8">
        {[
          { label: "총 게시글 수", value: professor.total_posts, icon: "📝" },
          { label: "총 댓글 수", value: professor.total_comments, icon: "💬" },
          { label: "긍정 비율", value: professor.positive_ratio, icon: "👍" },
          { label: "부정 비율", value: professor.negative_ratio, icon: "👎" },
          { label: "평균 감정 점수", value: professor.avg_sentiment_score, icon: "📊" },
          { label: "소통 점수", value: professor.communication_score, icon: "📞" },
        ].map((stat, index) => (
          <div
            key={index}
            className="flex-1 bg-white p-4 shadow rounded flex items-center justify-between"
          >
            <div>
              <h3 className="text-sm text-gray-500 font-semibold mb-2">{stat.label}</h3>
              <p className="text-2xl font-bold">{stat.value || "N/A"}</p>
            </div>
            <div className="text-3xl">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* 하단: 좌우 레이아웃 */}
      <div className="flex gap-4">
        {/* 좌측: 기본 정보 및 상세 프로필 */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="bg-white p-6 shadow rounded flex-1">
            <h2 className="text-xl font-bold mb-4">기본 정보 및 상세 프로필</h2>
            <p><strong>이름:</strong> {professor.Doctor_Name || "N/A"}</p>
            <p><strong>소속 병원:</strong> {professor.Hospital || "N/A"}</p>
            <p><strong>진료 과목:</strong> {professor.Department || "N/A"}</p>
            <p><strong>전문 분야:</strong> {professor.Specialty || "N/A"}</p>
            <p><strong>논문 저서 수:</strong> {professor.Paper_Count || 0}개</p>
            
            <div>
              <h3 className="font-semibold mt-4 mb-2">학력:</h3>
              {professor.Education_Parsed?.length > 0 ? (
                professor.Education_Parsed.map((edu, index) => (
                  <p key={index}>• {edu}</p>
                ))
              ) : (
                <p>학력 정보가 없습니다.</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mt-4 mb-2">경력:</h3>
              {professor.Experience_Parsed?.length > 0 ? (
                professor.Experience_Parsed.map((exp, index) => (
                  <p key={index}>• {exp}</p>
                ))
              ) : (
                <p>경력 정보가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 진료 스타일 분석 및 주요 키워드 */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="bg-white p-6 shadow rounded flex-1">
            <h2 className="text-xl font-bold mb-4">진료 스타일 분석</h2>
            <div className="mb-4">
              <h3 className="font-semibold">🩺 진료 스타일</h3>
              <p>{professor.treatment_style || "N/A"}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold">👍 고유한 특징</h3>
              <p>{professor.uniqueness || "N/A"}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold">💬 상담 스타일</h3>
              <p>{professor.consultation_style || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold">📝 환자 평가</h3>
              <p>{professor.patient_evaluation || "N/A"}</p>
            </div>
          </div>

          {/* 주요 키워드 */}
          <div className="bg-white p-6 shadow rounded flex-1">
            <h2 className="text-xl font-bold mb-4">주요 키워드</h2>
            <div className="flex flex-wrap gap-2">
              {keywords?.length > 0 ? (
                keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm"
                  >
                    #{keyword}
                  </span>
                ))
              ) : (
                <p>키워드가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessorDetailPage;





// import React, { useEffect, useState } from "react";

// import axios from "axios";
// import { useParams } from "react-router-dom";

// function ProfessorDetailPage() {
//   const { id } = useParams();
//   const [professor, setProfessor] = useState({});

//   useEffect(() => {
//     axios
//       .get(`http://127.0.0.1:8000/api/professors/${id}`)
//       .then((res) => setProfessor(res.data))
//       .catch((error) => console.error("Error fetching professor data:", error));
//   }, [id]);

//   const keywords = professor?.keywords
//     ? professor.keywords.split(",").map((keyword) => keyword.trim())
//     : [];

//   return (
//     <div className="p-8 bg-gray-100 min-h-screen">
//       {/* 상단: 정량 지표 */}
//        <div className="flex flex-wrap gap-4 mb-8">
//         {/* 총 게시글 수 */}
//         <div className="flex-1 bg-white p-6 shadow rounded-lg flex items-center justify-between">
//             <div>
//             <h3 className="text-sm text-gray-500 font-semibold mb-2">총 게시글 수</h3>
//             <p className="text-2xl font-bold">{professor?.total_posts || "N/A"}</p>
//             </div>
//             <div>
//             <span className="text-3xl text-blue-500">📝</span>
//             </div>
//         </div>

//         {/* 총 댓글 수 */}
//         <div className="flex-1 bg-white p-6 shadow rounded-lg flex items-center justify-between">
//             <div>
//             <h3 className="text-sm text-gray-500 font-semibold mb-2">총 댓글 수</h3>
//             <p className="text-2xl font-bold">{professor?.total_comments || "N/A"}</p>
//             </div>
//             <div>
//             <span className="text-3xl text-green-500">💬</span>
//             </div>
//         </div>

//         {/* 긍정 비율 */}
//         <div className="flex-1 bg-white p-6 shadow rounded-lg flex items-center justify-between">
//             <div>
//             <h3 className="text-sm text-gray-500 font-semibold mb-2">긍정 비율</h3>
//             <p className="text-2xl font-bold">{professor?.positive_ratio || "N/A"}%</p>
//             </div>
//             <div>
//             <span className="text-3xl text-yellow-500">👍</span>
//             </div>
//         </div>

//         {/* 부정 비율 */}
//         <div className="flex-1 bg-white p-6 shadow rounded-lg flex items-center justify-between">
//             <div>
//             <h3 className="text-sm text-gray-500 font-semibold mb-2">부정 비율</h3>
//             <p className="text-2xl font-bold">{professor?.negative_ratio || "N/A"}%</p>
//             </div>
//             <div>
//             <span className="text-3xl text-red-500">👎</span>
//             </div>
//         </div>

//         {/* 평균 감정 점수 */}
//         <div className="flex-1 bg-white p-6 shadow rounded-lg flex items-center justify-between">
//             <div>
//             <h3 className="text-sm text-gray-500 font-semibold mb-2">평균 감정 점수</h3>
//             <p className="text-2xl font-bold">{professor?.avg_sentiment_score || "N/A"}</p>
//             </div>
//             <div>
//             <span className="text-3xl text-purple-500">📊</span>
//             </div>
//         </div>

//         {/* 소통 점수 */}
//         <div className="flex-1 bg-white p-6 shadow rounded-lg flex items-center justify-between">
//             <div>
//             <h3 className="text-sm text-gray-500 font-semibold mb-2">소통 점수</h3>
//             <p className="text-2xl font-bold">{professor?.communication_score || "N/A"}</p>
//             </div>
//             <div>
//             <span className="text-3xl text-blue-700">📞</span>
//             </div>
//         </div>
//         </div>




//       {/* 기본 정보 */}
//       <div className="bg-white p-6 shadow rounded mb-8">
//         <h2 className="text-2xl font-bold mb-4">기본 정보</h2>
//         <p>
//           <strong>소속 병원:</strong> {professor.Hospital || "N/A"}
//         </p>
//         <p>
//           <strong>진료 과목:</strong> {professor.Department || "N/A"}
//         </p>
//         <p>
//           <strong>전문 분야:</strong> {professor.Specialty || "N/A"}
//         </p>
//       </div>

//       {/* 상세 프로필 */}
//       <div className="bg-white p-6 shadow rounded mb-8">
//         <h2 className="text-2xl font-bold mb-4">상세 프로필</h2>
//         <p>
//           <strong>논문 저서 수:</strong> {professor.Paper_Count || "N/A"}개
//         </p>
//         <div>
//           <h3 className="font-semibold mt-4 mb-2">학력:</h3>
//           {professor.Education_Parsed?.split(",").map((edu, index) => (
//             <p key={index}>• {edu.trim()}</p>
//           ))}
//         </div>
//         <div>
//           <h3 className="font-semibold mt-4 mb-2">경력:</h3>
//           {professor.Experience_Parsed?.split(",").map((exp, index) => (
//             <p key={index}>• {exp.trim()}</p>
//           ))}
//         </div>
//       </div>

//       {/* 진료 스타일 분석 */}
//       <div className="bg-white p-6 shadow rounded mb-8">
//         <h2 className="text-2xl font-bold mb-4">진료 스타일 분석</h2>
//         <div className="mb-4">
//           <h3 className="text-lg font-semibold">🩺 진료 스타일</h3>
//           <p>{professor?.treatment_style || "N/A"}</p>
//         </div>
//         <div className="mb-4">
//           <h3 className="text-lg font-semibold">👍 고유한 특징</h3>
//           <p>{professor?.uniqueness || "N/A"}</p>
//         </div>
//         <div className="mb-4">
//           <h3 className="text-lg font-semibold">💬 상담 스타일</h3>
//           <p>{professor?.consultation_style || "N/A"}</p>
//         </div>
//         <div>
//           <h3 className="text-lg font-semibold">📝 환자 평가</h3>
//           <p>{professor?.patient_evaluation || "N/A"}</p>
//         </div>
//       </div>

//       {/* 주요 키워드 */}
//       <div className="bg-white p-6 shadow rounded">
//         <h2 className="text-2xl font-bold mb-4">주요 키워드</h2>
//         <div className="flex flex-wrap gap-2">
//           {keywords.length > 0 ? (
//             keywords.map((keyword, index) => (
//               <span
//                 key={index}
//                 className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm"
//               >
//                 #{keyword}
//               </span>
//             ))
//           ) : (
//             <p>키워드가 없습니다.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ProfessorDetailPage;














// import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";

// import AccountCircleIcon from "@mui/icons-material/AccountCircle";
// import BarChartIcon from "@mui/icons-material/BarChart";
// import ChatIcon from "@mui/icons-material/Chat";
// import React from "react";
// import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
// import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
// import ThumbUpIcon from "@mui/icons-material/ThumbUp";
// import { styled } from "@mui/system";

// const StatCard = styled(Card)(({ theme }) => ({
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "space-between",
//   padding: theme.spacing(2),
// }));

// function ProfessorDetailPage({ professor }) {
//   if (!professor) return <div>Loading...</div>;

//   const stats = [
//     { label: "총 게시글 수", value: professor.total_posts || "N/A", icon: <BarChartIcon /> },
//     { label: "총 댓글 수", value: professor.total_comments || "N/A", icon: <ChatIcon /> },
//     { label: "긍정 비율", value: professor.positive_ratio || "N/A", icon: <ThumbUpIcon /> },
//     { label: "부정 비율", value: professor.negative_ratio || "N/A", icon: <SentimentDissatisfiedIcon /> },
//     { label: "평균 감정 점수", value: professor.avg_sentiment_score || "N/A", icon: <SentimentSatisfiedAltIcon /> },
//   ];

//   const keywords = professor?.keywords
//     ? professor.keywords.split(",").map((keyword) => keyword.trim())
//     : [];

//   return (
//     <Box sx={{ padding: 3 }}>
//       {/* 상단: 정량 지표 */}
//       <Grid container spacing={3} mb={3}>
//         {stats.map((stat, index) => (
//           <Grid item xs={12} md={4} key={index}>
//             <StatCard>
//               <Box sx={{ display: "flex", alignItems: "center" }}>
//                 {stat.icon}
//                 <Box ml={2}>
//                   <Typography variant="subtitle2" color="textSecondary">
//                     {stat.label}
//                   </Typography>
//                   <Typography variant="h5" fontWeight="bold">
//                     {stat.value}
//                   </Typography>
//                 </Box>
//               </Box>
//             </StatCard>
//           </Grid>
//         ))}
//       </Grid>

//       {/* 기본 정보 */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent>
//           <Typography variant="h6" fontWeight="bold" mb={2}>
//             기본 정보
//           </Typography>
//           <Typography>소속 병원: {professor.Hospital || "N/A"}</Typography>
//           <Typography>진료 과목: {professor.Department || "N/A"}</Typography>
//           <Typography>전문 분야: {professor.Specialty || "N/A"}</Typography>
//         </CardContent>
//       </Card>

//       {/* 상세 프로필 */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent>
//           <Typography variant="h6" fontWeight="bold" mb={2}>
//             상세 프로필
//           </Typography>
//           <Typography variant="subtitle1" fontWeight="bold">
//             논문 저서 수: {professor.Paper_Count || "N/A"}개
//           </Typography>
//           <Typography variant="subtitle2" fontWeight="bold" mt={2}>
//             학력:
//           </Typography>
//           {professor.Education_Parsed?.split(",").map((edu, index) => (
//             <Typography key={index}>- {edu.trim()}</Typography>
//           ))}
//           <Typography variant="subtitle2" fontWeight="bold" mt={2}>
//             경력:
//           </Typography>
//           {professor.Experience_Parsed?.split(",").map((exp, index) => (
//             <Typography key={index}>- {exp.trim()}</Typography>
//           ))}
//         </CardContent>
//       </Card>

//       {/* 진료 스타일 */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent>
//           <Typography variant="h6" fontWeight="bold" mb={2}>
//             진료 스타일 분석
//           </Typography>
//           <Typography>🩺 진료 스타일: {professor?.treatment_style || "N/A"}</Typography>
//           <Typography>👍 고유한 특징: {professor?.uniqueness || "N/A"}</Typography>
//           <Typography>💬 상담 스타일: {professor?.consultation_style || "N/A"}</Typography>
//           <Typography>📝 환자 평가: {professor?.patient_evaluation || "N/A"}</Typography>
//         </CardContent>
//       </Card>

//       {/* 주요 키워드 */}
//       <Card>
//         <CardContent>
//           <Typography variant="h6" fontWeight="bold" mb={2}>
//             주요 키워드
//           </Typography>
//           <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
//             {keywords.length > 0 ? (
//               keywords.map((keyword, index) => (
//                 <Chip key={index} label={`#${keyword}`} color="primary" variant="outlined" />
//               ))
//             ) : (
//               <Typography>키워드가 없습니다.</Typography>
//             )}
//           </Box>
//         </CardContent>
//       </Card>
//     </Box>
//   );
// }

// export default ProfessorDetailPage;
