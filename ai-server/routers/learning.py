from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from schemas.learning_schema import GenerateRequest, GenerateResponse, GradeRequest, GradeResponse, PlacementGenerateRequest, PlacementGenerateResponse, HintRequest, HintResponse
from services import learning_service

router = APIRouter()


@router.post("/generate/stream")
async def generate_problems_stream(req: GenerateRequest):
    """학습 문제 스트리밍 생성 - 완료되는 순서대로 SSE로 전송"""
    async def event_stream():
        try:
            async for problem in learning_service.generate_problems_stream(
                subject=req.subject,
                difficulty=req.difficulty,
                count=req.count,
            ):
                yield f"data: {problem.model_dump_json()}\n\n"
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/generate", response_model=GenerateResponse)
def generate_problems(req: GenerateRequest):
    """학습 문제 생성"""
    try:
        problems = learning_service.generate_problems(
            subject=req.subject,
            difficulty=req.difficulty,
            count=req.count,
            type=req.type,
        )
        return GenerateResponse(problems=problems)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"문제 생성 실패: {str(e)}")


@router.post("/grade", response_model=GradeResponse)
def grade_answer(req: GradeRequest):
    """사용자 답안 채점"""
    try:
        return learning_service.grade_answer(
            question=req.question,
            correct_answer=req.correctAnswer,
            user_answer=req.userAnswer,
            explanation=req.explanation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채점 실패: {str(e)}")


@router.post("/hint", response_model=HintResponse)
def get_hint(req: HintRequest):
    """문제 힌트 생성"""
    try:
        return learning_service.get_hint(
            question=req.question,
            choices=req.choices,
            subject=req.subject,
            difficulty=req.difficulty,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"힌트 생성 실패: {str(e)}")


@router.post("/placement/generate", response_model=PlacementGenerateResponse)
def generate_placement(req: PlacementGenerateRequest):
    """수준 진단 테스트 문제 생성"""
    try:
        problems = learning_service.generate_placement_problems(count=req.count)
        return PlacementGenerateResponse(problems=problems)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"진단 문제 생성 실패: {str(e)}")
