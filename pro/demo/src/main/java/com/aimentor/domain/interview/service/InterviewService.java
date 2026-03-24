package com.aimentor.domain.interview.service;

import com.aimentor.common.exception.BusinessException;
import com.aimentor.domain.interview.dto.InterviewDto;
import com.aimentor.domain.interview.entity.*;
import com.aimentor.domain.interview.repository.*;
import com.aimentor.external.ai.AiService;
import com.aimentor.external.ai.dto.FeedbackDto;
import com.aimentor.external.speech.SpeechService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI 모의 면접 비즈니스 로직
 * - 세션 시작 시 첫 질문을 AI에서 생성
 * - 답변 제출 시 STT 변환 후 다음 질문 생성
 * - 면접 종료 시 전체 대화 기록으로 피드백 생성
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewService {

    private final InterviewSessionRepository sessionRepo;
    private final InterviewQARepository qaRepo;
    private final InterviewFeedbackRepository feedbackRepo;
    private final AiService aiService;
    private final SpeechService speechService;

    /** 면접 세션 시작 — 첫 질문 생성 */
    @Transactional
    public InterviewDto.SessionResponse startSession(InterviewDto.StartRequest req, Long userId) {
        InterviewSession session = InterviewSession.builder()
                .userId(userId)
                .resumeId(req.getResumeId())
                .coverLetterId(req.getCoverLetterId())
                .jobPostingId(req.getJobPostingId())
                .startedAt(LocalDateTime.now())
                .build();
        session = sessionRepo.save(session);

        // AI에서 첫 번째 질문 생성
        // TODO: resumeId/coverLetterId/jobPostingId로 실제 텍스트 내용을 조회해서 전달
        String firstQuestion = aiService.generateInterviewQuestion(
                "", "", "", List.of());

        InterviewQA qa = InterviewQA.builder()
                .session(session)
                .orderNum(1)
                .question(firstQuestion)
                .build();
        qaRepo.save(qa);

        return new InterviewDto.SessionResponse(session, firstQuestion);
    }

    /** 내 세션 목록 */
    public List<InterviewDto.SessionResponse> getSessions(Long userId) {
        return sessionRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(s -> new InterviewDto.SessionResponse(s, null))
                .toList();
    }

    /** 세션 상세 + Q&A 목록 */
    public InterviewDto.SessionDetailResponse getSession(Long sessionId, Long userId) {
        InterviewSession session = findSessionOrThrow(sessionId, userId);
        List<InterviewDto.QAResponse> qaList = qaRepo.findBySessionIdOrderByOrderNum(sessionId)
                .stream().map(InterviewDto.QAResponse::new).toList();
        return new InterviewDto.SessionDetailResponse(session, qaList);
    }

    /**
     * 답변 제출
     * 1. audio 파일을 STT로 텍스트 변환
     * 2. 현재 Q에 답변 저장
     * 3. AI로 다음 질문 생성
     */
    @Transactional
    public InterviewDto.SessionResponse submitAnswer(Long sessionId, MultipartFile audio, Long userId) {
        InterviewSession session = findSessionOrThrow(sessionId, userId);
        if (session.getStatus() == SessionStatus.COMPLETED) {
            throw BusinessException.badRequest("이미 종료된 면접 세션입니다.");
        }

        // 가장 최근 미답변 Q 찾기
        List<InterviewQA> qaList = qaRepo.findBySessionIdOrderByOrderNum(sessionId);
        InterviewQA current = qaList.stream()
                .filter(qa -> qa.getAnswerText() == null)
                .findFirst()
                .orElseThrow(() -> BusinessException.badRequest("제출할 질문이 없습니다."));

        // STT 변환
        String answerText = speechService.speechToText(audio);
        // TODO: S3에 audio 파일 업로드 후 audioUrl 저장
        current.setAnswer(answerText, null);

        // 다음 질문 생성
        List<AiService.QAHistory> history = qaList.stream()
                .filter(qa -> qa.getAnswerText() != null)
                .map(qa -> new AiService.QAHistory(qa.getQuestion(), qa.getAnswerText()))
                .toList();

        String nextQuestion = aiService.generateInterviewQuestion("", "", "", history);

        InterviewQA nextQa = InterviewQA.builder()
                .session(session)
                .orderNum(current.getOrderNum() + 1)
                .question(nextQuestion)
                .build();
        qaRepo.save(nextQa);

        return new InterviewDto.SessionResponse(session, nextQuestion);
    }

    /** 텍스트 답변 제출 */
    @Transactional
    public InterviewDto.SessionResponse submitTextAnswer(Long sessionId, String answerText, Long userId) {
        InterviewSession session = findSessionOrThrow(sessionId, userId);
        if (session.getStatus() == SessionStatus.COMPLETED) {
            throw BusinessException.badRequest("이미 종료된 면접 세션입니다.");
        }

        List<InterviewQA> qaList = qaRepo.findBySessionIdOrderByOrderNum(sessionId);
        InterviewQA current = qaList.stream()
                .filter(qa -> qa.getAnswerText() == null)
                .findFirst()
                .orElseThrow(() -> BusinessException.badRequest("제출할 질문이 없습니다."));

        current.setAnswer(answerText, null);

        List<AiService.QAHistory> history = qaList.stream()
                .filter(qa -> qa.getAnswerText() != null)
                .map(qa -> new AiService.QAHistory(qa.getQuestion(), qa.getAnswerText()))
                .toList();

        String nextQuestion = aiService.generateInterviewQuestion("", "", "", history);

        InterviewQA nextQa = InterviewQA.builder()
                .session(session)
                .orderNum(current.getOrderNum() + 1)
                .question(nextQuestion)
                .build();
        qaRepo.save(nextQa);

        return new InterviewDto.SessionResponse(session, nextQuestion);
    }

    /** 면접 종료 — AI 피드백 생성 */
    @Transactional
    public InterviewDto.FeedbackResponse endSession(Long sessionId, Long userId) {
        InterviewSession session = findSessionOrThrow(sessionId, userId);
        session.end();

        List<InterviewQA> qaList = qaRepo.findBySessionIdOrderByOrderNum(sessionId);
        List<AiService.QAHistory> history = qaList.stream()
                .filter(qa -> qa.getAnswerText() != null)
                .map(qa -> new AiService.QAHistory(qa.getQuestion(), qa.getAnswerText()))
                .toList();

        FeedbackDto fb = aiService.generateFeedback(history);

        InterviewFeedback feedback = InterviewFeedback.builder()
                .session(session)
                .logicScore(fb.getLogicScore())
                .relevanceScore(fb.getRelevanceScore())
                .specificityScore(fb.getSpecificityScore())
                .overallScore(fb.getOverallScore())
                .weakPoints(fb.getWeakPoints())
                .improvements(fb.getImprovements())
                .recommendedAnswer(fb.getRecommendedAnswer())
                .build();
        feedbackRepo.save(feedback);

        return new InterviewDto.FeedbackResponse(feedback);
    }

    /** 피드백 조회 */
    public InterviewDto.FeedbackResponse getFeedback(Long sessionId, Long userId) {
        findSessionOrThrow(sessionId, userId); // 소유권 확인
        InterviewFeedback feedback = feedbackRepo.findBySessionId(sessionId)
                .orElseThrow(() -> BusinessException.notFound("피드백이 아직 생성되지 않았습니다."));
        return new InterviewDto.FeedbackResponse(feedback);
    }

    private InterviewSession findSessionOrThrow(Long sessionId, Long userId) {
        return sessionRepo.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> BusinessException.notFound("면접 세션을 찾을 수 없습니다."));
    }
}
