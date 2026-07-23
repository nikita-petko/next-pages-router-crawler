import type { DeepValidateSection } from '../interfaces/types';

type SectionLike = {
  questions?: QuestionLike[];
};

type QuestionLike = {
  id?: string;
  options?: Array<{
    childQuestions?: QuestionLike[];
    childSections?: SectionLike[];
  }>;
};

function containsQuestion(questions: QuestionLike[], targetId: string): boolean {
  return questions.some(
    (question) =>
      question.id === targetId ||
      (question.options ?? []).some(
        (option) =>
          (option.childQuestions && containsQuestion(option.childQuestions, targetId)) ||
          (option.childSections ?? []).some((section) =>
            containsQuestion(section.questions ?? [], targetId),
          ),
      ),
  );
}

/**
 * Maps an array of failed question IDs (from SubmitResponseResponseV2.failures)
 * to the set of section IDs that contain those questions.
 * Traverses child questions nested inside radio/checkbox options.
 */
export default function getViolatedSectionIds(
  sections: DeepValidateSection[],
  failedQuestionIds: string[],
): Set<string> {
  return new Set(
    sections
      .filter((section) =>
        failedQuestionIds.some((qId) => containsQuestion(section.questions as QuestionLike[], qId)),
      )
      .map((section) => section.id),
  );
}
