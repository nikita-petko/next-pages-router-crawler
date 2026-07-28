import {
  AnalyticsChatDataPartType,
  type AnalyticsChatMessage,
  type AskQuestionAnswerDataPart,
  type AskQuestionDataPart,
} from '../../types/AnalyticsChatTypes';
import {
  type AskQuestion,
  AskQuestionIntent,
  type AskQuestionItem,
  type AskQuestionOption,
  MAX_OPTION_DESCRIPTION_LENGTH,
  MAX_OPTION_LABEL_LENGTH,
  MAX_OPTIONS_PER_QUESTION,
  MAX_QUESTIONS_PER_CARD,
  MAX_SUMMARY_LENGTH,
} from '../../types/AskQuestion';

type AnalyticsChatMessagePart = AnalyticsChatMessage['parts'][number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function adaptOption(raw: unknown): AskQuestionOption | null {
  if (!isRecord(raw)) {
    return null;
  }
  const { id, label, description } = raw;
  if (typeof id !== 'string' || typeof label !== 'string') {
    return null;
  }
  return {
    id,
    label: truncate(label, MAX_OPTION_LABEL_LENGTH),
    description:
      typeof description === 'string'
        ? truncate(description, MAX_OPTION_DESCRIPTION_LENGTH)
        : undefined,
  };
}

function adaptQuestion(raw: unknown): AskQuestionItem | null {
  if (!isRecord(raw)) {
    return null;
  }
  const { id, prompt, options, allowMultiple, defaultOptionId } = raw;
  if (typeof id !== 'string' || typeof prompt !== 'string') {
    return null;
  }
  // Drop options that share an id: the render keys rows by id and highlights by
  // id, so a duplicate would collide React keys and make selection ambiguous.
  const seenOptionIds = new Set<string>();
  const adaptedOptions = (Array.isArray(options) ? options : [])
    .map(adaptOption)
    .filter((option): option is AskQuestionOption => option !== null)
    .filter((option) => {
      if (seenOptionIds.has(option.id)) {
        return false;
      }
      seenOptionIds.add(option.id);
      return true;
    })
    .slice(0, MAX_OPTIONS_PER_QUESTION);
  return {
    id,
    prompt,
    options: adaptedOptions,
    allowMultiple: allowMultiple === true,
    defaultOptionId: typeof defaultOptionId === 'string' ? defaultOptionId : undefined,
  };
}

/**
 * Validate and normalize the opaque `data-ask-question` payload into a usable
 * `AskQuestion`, defending the render against the same caps the backend enforces
 * on emit. Returns `null` when the payload is unusable (no valid questions),
 * so the caller can fall back to the plain-text turn.
 */
export function adaptAskQuestion(data: unknown): AskQuestion | null {
  if (!isRecord(data)) {
    return null;
  }
  const { askId, intent, summary, questions } = data;
  if (typeof askId !== 'string') {
    return null;
  }
  const adaptedQuestions = (Array.isArray(questions) ? questions : [])
    .map(adaptQuestion)
    .filter((question): question is AskQuestionItem => question !== null)
    .slice(0, MAX_QUESTIONS_PER_CARD);
  if (adaptedQuestions.length === 0) {
    return null;
  }
  return {
    askId,
    intent:
      intent === AskQuestionIntent.Authorize
        ? AskQuestionIntent.Authorize
        : AskQuestionIntent.Clarify,
    summary: typeof summary === 'string' ? truncate(summary, MAX_SUMMARY_LENGTH) : undefined,
    questions: adaptedQuestions,
  };
}

export function isAskQuestionPart(part: AnalyticsChatMessagePart): part is AskQuestionDataPart {
  return part.type === AnalyticsChatDataPartType.AskQuestion;
}

export function isAskQuestionAnswerPart(
  part: AnalyticsChatMessagePart,
): part is AskQuestionAnswerDataPart {
  return part.type === AnalyticsChatDataPartType.AskQuestionAnswer;
}

/**
 * Extract the first valid question card from a message's parts, or `null` when
 * there are none. A card ends the assistant turn, so at most one is expected.
 * Takes `parts` (not the whole message) to match its sibling adapters and keep
 * callers' memo dependencies granular.
 */
export function adaptAskQuestionParts(parts: AnalyticsChatMessagePart[]): AskQuestion | null {
  for (const part of parts) {
    if (isAskQuestionPart(part)) {
      const adapted = adaptAskQuestion(part.data);
      if (adapted) {
        return adapted;
      }
    }
  }
  return null;
}
