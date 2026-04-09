from fastapi import APIRouter
from schemas.resume_schema import ResumeReviewRequest, ResumeReviewResponse
from services import resume_service

router = APIRouter()


@router.post("/review", response_model=ResumeReviewResponse)
def review_document(request: ResumeReviewRequest):
    result = resume_service.review_document(request.content, request.documentType)
    return result
