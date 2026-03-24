from fastapi import APIRouter, HTTPException
from schemas.interview_schema import (
    QuestionRequest, QuestionResponse, FeedbackRequest, FeedbackResponse,
    BatchQuestionsRequest, BatchQuestionsResponse, QuestionItem,
    AnalyzeAnswerRequest, AnalyzeAnswerResponse,
    ReportSummaryRequest, ReportSummaryResponse,
    ParseJobPostingRequest, ParseJobPostingResponse,
)
from services import interview_service

router = APIRouter()


@router.post("/question", response_model=QuestionResponse)
def generate_question(req: QuestionRequest):
    """다음 면접 질문 생성"""
    try:
        result = interview_service.generate_question(
            resume=req.resumeContent,
            cover_letter=req.coverLetterContent,
            job_description=req.jobDescription,
            history=req.conversationHistory,
        )
        return QuestionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"질문 생성 실패: {str(e)}")


@router.post("/feedback", response_model=FeedbackResponse)
def generate_feedback(req: FeedbackRequest):
    """면접 전체 피드백 생성"""
    try:
        return interview_service.generate_feedback(req.conversationHistory)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"피드백 생성 실패: {str(e)}")


# ── Java 백엔드 연동용 엔드포인트 ──

@router.post("/questions/batch", response_model=BatchQuestionsResponse)
def generate_batch_questions(req: BatchQuestionsRequest):
    """면접 질문 N개 일괄 생성 (Java 백엔드 전용)"""
    try:
        questions = interview_service.generate_batch_questions(
            position_title=req.positionTitle,
            resume_summary=req.resumeSummary or "",
            job_description=req.jobDescription or "",
            question_count=req.questionCount,
        )
        return BatchQuestionsResponse(questions=[QuestionItem(**q) for q in questions])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"질문 생성 실패: {str(e)}")


@router.post("/answer/analyze", response_model=AnalyzeAnswerResponse)
def analyze_answer(req: AnalyzeAnswerRequest):
    """답변 분석 및 점수 반환 (Java 백엔드 전용)"""
    try:
        result = interview_service.analyze_answer(
            question_text=req.questionText,
            answer_text=req.answerText,
            job_description=req.jobDescription or "",
        )
        return AnalyzeAnswerResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"답변 분석 실패: {str(e)}")


@router.post("/job-posting/parse", response_model=ParseJobPostingResponse)
def parse_job_posting(req: ParseJobPostingRequest):
    """채용공고 URL에서 회사명·직무·내용 자동 추출 (Java 백엔드 전용)"""
    try:
        result = interview_service.parse_job_posting(url=req.url, content=req.content)
        return ParseJobPostingResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채용공고 파싱 실패: {str(e)}")


@router.post("/report/summary", response_model=ReportSummaryResponse)
def generate_report_summary(req: ReportSummaryRequest):
    """면접 세션 리포트 요약 생성 (Java 백엔드 전용)"""
    try:
        summary = interview_service.generate_report_summary(
            session_title=req.sessionTitle,
            position_title=req.positionTitle or "",
            answer_feedback=[f.model_dump() if hasattr(f, "model_dump") else f for f in req.answerFeedback],
        )
        return ReportSummaryResponse(**summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리포트 생성 실패: {str(e)}")
