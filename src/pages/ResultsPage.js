import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useFilters, useSortBy, useTable } from "react-table";

import axios from "axios";

function ResultsPage() {
 const location = useLocation();
 const [gptAnswer, setGptAnswer] = useState("");
 const [professors, setProfessors] = useState([]);
 const query = new URLSearchParams(location.search).get("query");

  // EC2 public IP 입력
  const response = await axios.post("http://ec2-52-78-230-49.ap-northeast-2.compute.amazonaws.com:8000/api/qa", { 
    question: query 
  });

 // GPT API 호출
 useEffect(() => {
   const fetchGptAnswer = async () => {
     try {
       console.log("Fetching GPT answer for query:", query);
       const response = await axios.post("http://localhost:8000/api/qa", {
         question: query
       });
       console.log("GPT Response:", response.data);
       setGptAnswer(response.data.answer);
     } catch (error) {
       console.error("Error fetching GPT answer:", error);
       setGptAnswer("답변을 가져오지 못했습니다.");
     }
   };

   if (query) {
     fetchGptAnswer();
   }
 }, [query]);

 // GPT 답변 기반 교수 리스트 API 호출
// GPT 답변 기반 교수 리스트 API 호출
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const mainMatch = gptAnswer.match(/주요 진료분야\(Main\): ([^\n]+)/);
        if (mainMatch) {
          const mainKeyword = mainMatch[1]
            .trim()
            .split('-')[0]
            .replace(/[*]/g, '')
            .trim();
    
          console.log("Extracted Main keyword:", mainKeyword);
          console.log("Full matched string:", mainMatch[0]);
          
          const response = await axios.get(`http://localhost:8000/api/professors`, {
            params: { query: mainKeyword }
          });
          
          console.log("API Response data:", response.data);
          console.log("Number of professors found:", response.data.length);
          
          // 각 교수의 cancer 관련 컬럼 값들 출력
          response.data.forEach(prof => {
            console.log(`\nProfessor ${prof.Doctor_Name}:`);
            Object.entries(prof).forEach(([key, value]) => {
              if (key.startsWith('is_cancer') && value === 1) {
                console.log(`  ${key}: ${value}`);
              }
            });
          });
          
          const numberedData = response.data.map((item, index) => ({
            No: index + 1,
            ...item,
          }));
          
          setProfessors(numberedData);
        }
      } catch (error) {
        console.error("Error fetching professors:", error);
      }
    };
    
    if (gptAnswer) {
      console.log("Full GPT Answer:", gptAnswer);
      fetchProfessors();
    }
    }, [gptAnswer, query]);

 // 테이블 데이터와 컬럼 정의
 const data = React.useMemo(() => professors, [professors]);
 const columns = React.useMemo(
   () => [
     { Header: "No", accessor: "No" },
     { Header: "소속 병원", accessor: "Hospital" },
     {
       Header: "이름",
       accessor: "Doctor_Name",
       Cell: ({ row }) => (
         <Link
           to={`/professor/${row.original.ID}?query=${encodeURIComponent(query)}`}
           className="text-blue-500 underline hover:text-blue-700"
         >
           {row.original.Doctor_Name}
         </Link>
       ),
     },
     { Header: "진료 과목", accessor: "Department" },
     { Header: "전문 분야", accessor: "Specialty" },
   ],
   [query]
 );

 const tableInstance = useTable({ columns, data }, useFilters, useSortBy);
 const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setFilter } =
   tableInstance;

 return (
   <div className="p-8 bg-gray-100 min-h-screen">
     {/* 질문과 GPT 답변 */}
     <h1 className="text-3xl font-bold mb-4">검색 결과</h1>
     <p className="text-lg mb-6">질문: {query}</p>
     <div className="bg-white p-4 rounded shadow mb-8">
       <h2 className="text-xl font-bold mb-2">GPT 답변</h2>
       <p>{gptAnswer}</p>
     </div>
     
     {/* 필터 입력 */}
     <div className="flex mb-4">
       <input
         type="text"
         placeholder="소속 병원 필터링"
         onChange={(e) => setFilter("Hospital", e.target.value)}
         className="p-2 border border-gray-300 rounded mr-2"
       />
       <input
         type="text"
         placeholder="이름 필터링"
         onChange={(e) => setFilter("Doctor_Name", e.target.value)}
         className="p-2 border border-gray-300 rounded mr-2"
       />
       <input
         type="text"
         placeholder="전문 분야 필터링"
         onChange={(e) => setFilter("Specialty", e.target.value)}
         className="p-2 border border-gray-300 rounded"
       />
     </div>

     {/* 교수 리스트 테이블 */}
     <h2 className="text-2xl font-bold mb-4">관련 교수 리스트</h2>
     <table {...getTableProps()} className="w-full bg-white shadow rounded">
       <thead>
         {headerGroups.map((headerGroup) => (
           <tr {...headerGroup.getHeaderGroupProps()} className="bg-blue-500 text-white">
             {headerGroup.headers.map((column) => (
               <th
                 {...column.getHeaderProps(column.getSortByToggleProps())}
                 className="p-3 text-center"
                 style={{ minWidth: column.id === "No" ? "50px" : "150px" }}
               >
                 {column.render("Header")}
                 <span>
                   {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                 </span>
               </th>
             ))}
           </tr>
         ))}
       </thead>
       <tbody {...getTableBodyProps()}>
         {rows.map((row) => {
           prepareRow(row);
           return (
             <tr {...row.getRowProps()} className="hover:bg-gray-200">
               {row.cells.map((cell) => {
                 return (
                   <td
                     {...cell.getCellProps()}
                     className="p-3 text-center"
                     style={{ minWidth: cell.column.id === "No" ? "50px" : "150px" }}
                   >
                     {cell.render("Cell")}
                   </td>
                 );
               })}
             </tr>
           );
         })}
       </tbody>
     </table>
   </div>
 );
}

export default ResultsPage;