import os
import tempfile
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ALLOWED_EXTENSIONS = {"webm", "wav", "mp3", "mp4", "m4a"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB


def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """음성 파일을 텍스트로 변환 (Whisper API 사용)"""

    # 파일 확장자 검사
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"지원하지 않는 파일 형식: {ext}")

    # 파일 크기 검사
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("파일 크기가 25MB를 초과합니다")

    # 임시 파일에 저장 후 Whisper API 호출
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ko",  # 한국어 우선
            )
        return transcript.text
    finally:
        os.unlink(tmp_path)  # 임시 파일 삭제
