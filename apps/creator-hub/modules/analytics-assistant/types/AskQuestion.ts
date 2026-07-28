/**
 * FE contracts for the structured clarifying-question (Q&A) tool.
 *
 * Mirrors the backend `AskQuestion` / `AskQuestionAnswer` pydantic models
 * (`client-analytics-assistant-api` >= 1.3.1). These travel inside the opaque
 * `data-ask-question` / `data-ask-question-answer` content parts — the wire
 * type (`DataPart.data`) is untyped, so the FE owns these shapes, as the
 * Visualization data part does for its envelope. There is no compile-time link
 * to the backend schema, so keep these in sync with the pydantic models on each
 * `client-analytics-assistant-api` bump.
 *
 * Refs:
 * - Tech Spec: Structured Clarifying-Question (Q&A) Tool
 * - https://github.rbx.com/Roblox/creator-analytics-assistant/pull/725
 */

// Validation caps — enforced backend-side on emit; defended FE-side on render.
export const MAX_QUESTIONS_PER_CARD = 4;
export const MAX_OPTIONS_PER_QUESTION = 6;
export const MAX_OPTION_LABEL_LENGTH = 80;
export const MAX_OPTION_DESCRIPTION_LENGTH = 160;
export const MAX_SUMMARY_LENGTH = 200;

/**
 * How a resumed answer is handled. Extensible; Phase 1 implements `clarify`
 * only (`authorize` bind-and-replay is forward-compat, not yet emitted).
 */
export enum AskQuestionIntent {
  Clarify = 'clarify',
  Authorize = 'authorize',
}

/** A single selectable option on a question. */
export interface AskQuestionOption {
  id: string;
  label: string;
  description?: string;
}

/** A single question; `options` may be empty when only free text is wanted. */
export interface AskQuestionItem {
  id: string;
  prompt: string;
  options: AskQuestionOption[];
  /** When true, more than one option may be selected (and combined with `other`). */
  allowMultiple: boolean;
  /** clarify-only; schema-only in Phase 1 (not applied by the FE). */
  defaultOptionId?: string;
}

/** The question card emitted to the client (assistant -> client). */
export interface AskQuestion {
  askId: string;
  intent: AskQuestionIntent;
  /** Planner-authored one-line message shown as the assistant's text. */
  summary?: string;
  questions: AskQuestionItem[];
}

/**
 * One question's structured answer (client -> backend), fully self-describing:
 * `prompt` and `selectedLabels` are denormalized from the card so the backend
 * can derive natural language from the answer alone (correct even after
 * conversation-history truncation).
 */
export interface QuestionAnswer {
  questionId: string;
  prompt: string;
  optionIds: string[];
  selectedLabels: string[];
  otherText?: string;
  skipped: boolean;
}

/** The structured answer returned for a card (client -> backend). */
export interface AskQuestionAnswer {
  askId: string;
  answers: QuestionAnswer[];
}
