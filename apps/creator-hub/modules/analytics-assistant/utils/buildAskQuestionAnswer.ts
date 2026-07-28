import type {
  AskQuestion,
  AskQuestionAnswer,
  AskQuestionItem,
  QuestionAnswer,
} from '../types/AskQuestion';

/**
 * A single question's local selection state held by the card while the creator
 * is answering, before it is assembled into the structured {@link QuestionAnswer}.
 */
export interface QuestionSelection {
  /** Selected option ids, in selection order. */
  optionIds: string[];
  /** Free-text entered in the "Other…" field, when present. */
  otherText?: string;
  /** True when the creator skipped this question. */
  skipped?: boolean;
}

export const EMPTY_SELECTION: QuestionSelection = { optionIds: [] };

/** A missing or fully-cleared selection: treated as an explicit skip. */
export const SKIPPED_SELECTION: QuestionSelection = { optionIds: [], skipped: true };

const LABEL_SEPARATOR = ', ';

function selectedLabelsFor(question: AskQuestionItem, optionIds: string[]): string[] {
  // Preserve option order so the derived display text is stable regardless of
  // the order the creator clicked.
  return question.options
    .filter((option) => optionIds.includes(option.id))
    .map((option) => option.label);
}

/** Assemble one question's structured answer, denormalizing `prompt` + `selectedLabels`. */
export function buildQuestionAnswer(
  question: AskQuestionItem,
  selection: QuestionSelection,
): QuestionAnswer {
  // Treat an explicit skip, or a selection the creator cleared back to nothing
  // (deselected the last option, emptied the Other field), as a skip — otherwise
  // an untouched question and a cleared one would submit divergent shapes.
  const skipped = selection.skipped === true || !hasSelection(selection);
  const otherText = selection.otherText?.trim() ? selection.otherText.trim() : undefined;
  const optionIds = skipped ? [] : selection.optionIds;
  return {
    questionId: question.id,
    prompt: question.prompt,
    optionIds,
    selectedLabels: skipped ? [] : selectedLabelsFor(question, optionIds),
    otherText: skipped ? undefined : otherText,
    skipped,
  };
}

/** Assemble the full card answer from per-question selections (missing entries are skipped). */
export function buildAskQuestionAnswer(
  askQuestion: AskQuestion,
  selections: Record<string, QuestionSelection>,
): AskQuestionAnswer {
  return {
    askId: askQuestion.askId,
    answers: askQuestion.questions.map((question) =>
      buildQuestionAnswer(question, selections[question.id] ?? SKIPPED_SELECTION),
    ),
  };
}

/** Assemble an all-skipped answer, used when the card is dismissed via the close control. */
export function buildSkippedAskQuestionAnswer(askQuestion: AskQuestion): AskQuestionAnswer {
  return {
    askId: askQuestion.askId,
    answers: askQuestion.questions.map((question) => ({
      questionId: question.id,
      prompt: question.prompt,
      optionIds: [],
      selectedLabels: [],
      skipped: true,
    })),
  };
}

/**
 * The display string for a single answered question: the selected option
 * labels and any free-text answer joined by `, `, or the skipped placeholder.
 * Used to render the read-only (answered) card state. This is the FE's own
 * summary for display; the backend derives the natural-language turn from the
 * denormalized `prompt` + `selectedLabels`, so keep the two aligned if the
 * phrasing ever needs to match.
 */
export function deriveQuestionDisplayText(answer: QuestionAnswer, skippedText: string): string {
  if (answer.skipped) {
    return skippedText;
  }
  const parts = [...answer.selectedLabels];
  if (answer.otherText?.trim()) {
    parts.push(answer.otherText.trim());
  }
  return parts.join(LABEL_SEPARATOR);
}

/** True when a selection carries something submittable (an option or free text). */
export function hasSelection(selection: QuestionSelection): boolean {
  return selection.optionIds.length > 0 || Boolean(selection.otherText?.trim());
}
