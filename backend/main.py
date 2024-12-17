from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import openai
import os
from dotenv import load_dotenv
import numpy as np
from medical_qa import MedicalQASystem

app = FastAPI()

# QA 시스템 초기화
try:
    print("Initializing QA system...")
    qa_system = MedicalQASystem()
    print("QA system initialized successfully")
except Exception as e:
    print(f"Failed to initialize QA system: {str(e)}")
    raise

# CORS 설정
app.add_middleware(
    CORSMiddleware,
        allow_origins=[
        "https://staging.d2wy9btdh4734.amplifyapp.com",
        "http://ec2-52-78-230-49.ap-northeast-2.compute.amazonaws.com:3000"  # 개발 환경용
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델
class QARequest(BaseModel):
    question: str

class QAResponse(BaseModel):
    answer: str

# 환경변수 로드
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# CSV 데이터 로드
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_file_path = os.path.join(BASE_DIR, "Profile_refine_4_241217.xlsx")
df = pd.read_excel(csv_file_path)

# 데이터 전처리
df = df.replace("N/A", None)
for col in df.columns:
    if df[col].dtype == object:
        df[col] = df[col].fillna("N/A")
    else:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

# API 엔드포인트
@app.get("/")
def read_root():
    return {"message": "FastAPI 서버가 정상적으로 실행 중입니다!"}

@app.post("/api/qa", response_model=QAResponse)
async def get_gpt_answer(request: QARequest):
    try:
        response = await qa_system.ask_question(request.question)
        return {"answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

@app.get("/api/professors")
def get_professors(query: str | None = None):
    try:
        filtered_data = df
        
        if query:
            # 디버깅 로그 추가
            print(f"\nReceived query: {query}")
            
            cancer_mapping = {
                '폐암': 'is_cancer_lung',
                '간암': 'is_cancer_liver',
                '위암': 'is_cancer_stomach',
                '대장암': 'is_cancer_intestine',
                '유방암': 'is_cancer_breast',
                '자궁경부암': 'is_cancer_cervix',
                '췌장암': 'is_cancer_pancreas'
            }
            
            matched_columns = []
            for cancer_type, column in cancer_mapping.items():
                if cancer_type in query.lower():
                    matched_columns.append(column)
                    # 매칭된 컬럼의 1값을 가진 행 수 출력
                    matching_rows = len(df[df[column] == 1])
                    print(f"Found match: {cancer_type} -> {column}")
                    print(f"Number of professors with {column} = 1: {matching_rows}")
            
            if matched_columns:
                condition = df[matched_columns[0]] == 1
                for column in matched_columns[1:]:
                    condition = condition | (df[column] == 1)
                filtered_data = df[condition]
                
                # 필터링된 결과의 상세 정보 출력
                print(f"\nFiltered results:")
                for _, row in filtered_data.iterrows():
                    print(f"Professor: {row['Doctor_Name']}, Hospital: {row['Hospital']}")
                    print(f"Cancer columns: {[col for col in matched_columns if row[col] == 1]}")
            
            print(f"Total matches found: {len(filtered_data)}")
        
        return filtered_data.to_dict(orient="records")
        
    except Exception as e:
        print(f"Error in get_professors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/professors/{professor_id}")
def get_professor_by_id(professor_id: int):
    """특정 교수의 상세 정보를 ID를 기반으로 반환"""
    try:
        professor = df.loc[df['ID'] == professor_id].to_dict(orient="records")
        if not professor:
            raise HTTPException(status_code=404, detail="교수를 찾을 수 없습니다.")
        return professor[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))