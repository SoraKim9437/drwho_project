import boto3
import os
from pathlib import Path
 
class AWSConfig:
    def __init__(self):
        """AWS S3 클라이언트 초기화"""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'ap-northeast-2')
        )
 
    def download_file_from_s3(self, bucket_name: str, s3_file_key: str, local_file_path: str | Path):
        """S3에서 파일 다운로드"""
        try:
            self.s3_client.download_file(bucket_name, s3_file_key, str(local_file_path))
            print(f"Successfully downloaded {s3_file_key} from {bucket_name} to {local_file_path}")
        except Exception as e:
            print(f"Error downloading file from S3: {e}")
            raise
 
    def upload_file_to_s3(self, local_file_path: str | Path, bucket_name: str, s3_file_key: str):
        """S3에 파일 업로드"""
        try:
            self.s3_client.upload_file(str(local_file_path), bucket_name, s3_file_key)
            print(f"Successfully uploaded {local_file_path} to {bucket_name}/{s3_file_key}")
        except Exception as e:
            print(f"Error uploading file to S3: {e}")
            raise