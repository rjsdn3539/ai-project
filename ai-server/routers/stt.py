from fastapi import APIRouter, UploadFile, File, HTTPException
from schemas.stt_schema import SttResponse
from services import whisper_service

router = APIRouter()


@router.post("", response_model=SttResponse)
async def speech_to_text(audio: UploadFile = File(...)):
    """음성 파일을 텍스트로 변환"""
    try:
        file_bytes = await audio.read()
        text = whisper_service.transcribe_audio(file_bytes, audio.filename)
        return SttResponse(text=text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT 변환 실패: {str(e)}")
