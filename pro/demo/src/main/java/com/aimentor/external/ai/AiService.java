package com.aimentor.external.ai;

import com.aimentor.external.ai.dto.FeedbackDto;
import com.aimentor.external.ai.dto.GradeResultDto;
import com.aimentor.external.ai.dto.ProblemDto;

import java.util.List;

/**
 * Python AI 서버와의 통신 추상화 인터페이스
 * 구현체: PythonAiService (실제), MockAiService (테스트용)
 */
public interface AiService {

    /**
     * 면접 질문 생성
     * @param resumeContent      이력서 텍스트
     * @param coverLetterContent 자기소개서 텍스트
     * @param jobDescription     채용공고 텍스트
     * @param history            이전 질문/답변 기록
     * @return 다음 면접 질문
     */
    String generateInterviewQuestion(String resumeContent,
                                     String coverLetterContent,
                                     String jobDescription,
                                     List<QAHistory> history);

    /**
     * 면접 피드백 생성
     * @param history 전체 질문/답변 기록
     * @return 점수 + 피드백
     */
    FeedbackDto generateFeedback(List<QAHistory> history);

    /**
     * 학습 문제 생성
     * @param subject    과목명 (영어, 국사 등)
     * @param difficulty EASY | MEDIUM | HARD
     * @param count      문제 수
     * @return 문제 목록
     */
    List<ProblemDto> generateLearningProblems(String subject, String difficulty, int count);

    /**
     * 학습 답변 채점
     * @param question      문제 내용
     * @param correctAnswer 정답
     * @param userAnswer    사용자 답안
     * @return 정오답 + AI 피드백
     */
    GradeResultDto gradeLearningAnswer(String question, String correctAnswer, String userAnswer);

    /** Q&A 히스토리 레코드 */
    record QAHistory(String question, String answer) {}
}
