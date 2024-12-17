from dataclasses import dataclass
from typing import List, Optional
import pandas as pd
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

@dataclass
class DoctorProfile:
    """의사 프로필 정보를 담는 데이터 클래스"""
    id: int
    hospital: str
    doctor_name: str
    department: str
    main_focus: str
    specialty: str
    paper_count: int
    education: str
    experience: str
    specialty_detail: str
    treatment_style: str
    uniqueness: str
    patient_evaluation: str
    consultation_style: str
    keywords: str
    
    # 선택적 필드 (NaN 값이 있는 필드들)
    total_posts: Optional[float] = None
    total_comments: Optional[float] = None
    positive_ratio: Optional[float] = None
    negative_ratio: Optional[float] = None
    neutral_ratio: Optional[float] = None
    avg_sentiment_score: Optional[float] = None
    communication_score: Optional[float] = None
    most_frequent_patterns: Optional[float] = None

class DataProcessor:
    """의사 프로필 데이터 처리를 위한 클래스"""
    
    def process_file(self, file_path: str | Path) -> List[DoctorProfile]:
        """CSV 파일을 읽고 DoctorProfile 객체 리스트로 변환"""
        try:
            logger.info(f"Reading CSV file from: {file_path}")
            df = pd.read_csv(file_path)
            records = []
            
            for idx, row in df.iterrows():
                try:
                    # 필수 필드 처리
                    profile = DoctorProfile(
                        id=int(row['ID']),
                        hospital=str(row['Hospital']).strip(),
                        doctor_name=str(row['Doctor_Name']).strip(),
                        department=str(row['Department']).strip(),
                        main_focus=str(row['Main']).strip(),
                        specialty=str(row['Specialty']).strip(),
                        paper_count=int(row['Paper_Count']),
                        education=str(row['Education_Parsed']).strip(),
                        experience=str(row['Experience_Parsed']).strip(),
                        specialty_detail=str(row['specialty']).strip(),
                        treatment_style=str(row['treatment_style']).strip(),
                        uniqueness=str(row['uniqueness']).strip(),
                        patient_evaluation=str(row['patient_evaluation']).strip(),
                        consultation_style=str(row['consultation_style']).strip(),
                        keywords=str(row['keywords']).strip(),
                        
                        # 선택적 필드 처리 (NaN 값이 있는 필드들)
                        total_posts=float(row['total_posts']) if pd.notna(row['total_posts']) else None,
                        total_comments=float(row['total_comments']) if pd.notna(row['total_comments']) else None,
                        positive_ratio=float(row['positive_ratio']) if pd.notna(row['positive_ratio']) else None,
                        negative_ratio=float(row['negative_ratio']) if pd.notna(row['negative_ratio']) else None,
                        neutral_ratio=float(row['neutral_ratio']) if pd.notna(row['neutral_ratio']) else None,
                        avg_sentiment_score=float(row['avg_sentiment_score']) if pd.notna(row['avg_sentiment_score']) else None,
                        communication_score=float(row['communication_score']) if pd.notna(row['communication_score']) else None,
                        most_frequent_patterns=float(row['most_frequent_patterns']) if pd.notna(row['most_frequent_patterns']) else None
                    )
                    
                    records.append(profile)
                    logger.debug(f"Successfully processed profile for Dr. {profile.doctor_name}")
                    
                except Exception as e:
                    logger.error(f"Error processing row {idx}: {e}")
                    continue
            
            logger.info(f"Successfully processed {len(records)} doctor profiles out of {len(df)} total")
            return records
                
        except Exception as e:
            logger.error(f"Error processing file: {e}")
            raise

    def validate_record(self, record: DoctorProfile) -> bool:
        """프로필 유효성 검사"""
        return (
            bool(record.doctor_name) and 
            bool(record.hospital) and 
            bool(record.department) and
            bool(record.specialty)
        )

    def create_searchable_text(self, record: DoctorProfile) -> str:
        """검색 가능한 텍스트 생성"""
        return f"""
        의사명: {record.doctor_name}
        병원: {record.hospital}
        진료과: {record.department}
        전문 분야: {record.specialty}
        주요 진료: {record.main_focus}
        
        학력:
        {record.education}
        
        경력:
        {record.experience}
        
        진료 스타일:
        {record.treatment_style}
        
        특징:
        {record.uniqueness}
        
        환자 평가:
        {record.patient_evaluation}
        
        상담 스타일:
        {record.consultation_style}
        
        키워드:
        {record.keywords}
        """