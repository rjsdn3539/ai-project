from dotenv import load_dotenv
load_dotenv()  # 반드시 다른 import보다 먼저 실행

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stt, interview, learning

app = FastAPI(title="AI Interview Platform - AI Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Spring Boot 백엔드만 허용
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stt.router, prefix="/stt", tags=["STT"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(learning.router, prefix="/learning", tags=["Learning"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
