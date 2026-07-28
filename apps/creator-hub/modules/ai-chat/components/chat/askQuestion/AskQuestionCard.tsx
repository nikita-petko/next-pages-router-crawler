import type { FC, KeyboardEvent } from 'react';
import React, { useRef } from 'react';
import { Divider } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type {
  AskQuestion,
  AskQuestionAnswer,
} from '@modules/analytics-assistant/types/AskQuestion';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AskQuestionCardHeader from './AskQuestionCardHeader';
import AskQuestionOptionRow from './AskQuestionOptionRow';
import AskQuestionOtherRow from './AskQuestionOtherRow';
import AskQuestionReview from './AskQuestionReview';
import { useAskQuestionState } from './useAskQuestionState';

const DIGIT_KEY_PATTERN = /^[1-9]$/;
const ENTER_KEY = 'Enter';
// The card is a lighter header strip over a darker core area, inside a bordered, clipped shell.
// Capped so a tall/paginated card scrolls its core (below) instead of pushing the docked input.
const CARD_CLASSNAME =
  'flex flex-col radius-large stroke-thin stroke-default clip bg-surface-200 max-height-[420px]';
// `min-height-0 scroll-y` lets the option list scroll within the capped card while the header stays put.
const CORE_CLASSNAME = 'flex flex-col gap-small padding-small bg-surface-100 min-height-0 scroll-y';
// The Review summary gets roomier padding than the tight question list (Figma: L16 R16 T12 B12).
const REVIEW_CORE_CLASSNAME =
  'flex flex-col padding-x-large padding-y-medium bg-surface-100 min-height-0 scroll-y';
const OPTIONS_CLASSNAME = 'flex flex-col gap-xsmall';
const HINT_CLASSNAME = 'flex justify-center padding-top-small';

export interface AskQuestionCardProps {
  askQuestion: AskQuestion;
  /** Fired once with the assembled answer when the creator confirms (Review "Continue") or dismisses the card. */
  onSubmit: (answer: AskQuestionAnswer) => void;
  className?: string;
}

interface AskQuestionLabels {
  skip: string;
  otherPlaceholder: string;
  otherAriaLabel: string;
  previousStep: string;
  nextStep: string;
  dismiss: string;
  skipped: string;
  reviewTitle: string;
  continueAction: string;
  edit: string;
  navHint: string;
}

function useAskQuestionLabels(): AskQuestionLabels {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return {
    skip: tPendingTranslation(
      'Skip',
      'Button that dismisses the clarifying-question card, skipping all of its questions.',
      translationKey('Action.SkipQuestion', TranslationNamespace.AnalyticsAssistant),
    ),
    otherPlaceholder: tPendingTranslation(
      'Other…',
      'Placeholder for the free-text field where the creator types their own answer.',
      translationKey('Label.OtherOptionPlaceholder', TranslationNamespace.AnalyticsAssistant),
    ),
    otherAriaLabel: tPendingTranslation(
      'Other answer',
      'Accessible label for the free-text answer field on a clarifying question.',
      translationKey('Label.OtherAnswer', TranslationNamespace.AnalyticsAssistant),
    ),
    previousStep: tPendingTranslation(
      'Previous',
      'Accessible label for the control that navigates to the previous question or the review.',
      translationKey('Label.PreviousStep', TranslationNamespace.AnalyticsAssistant),
    ),
    nextStep: tPendingTranslation(
      'Next',
      'Accessible label for the control that navigates to the next question or the review.',
      translationKey('Label.NextStep', TranslationNamespace.AnalyticsAssistant),
    ),
    dismiss: tPendingTranslation(
      'Dismiss',
      'Accessible label for the control that dismisses the clarifying-question card and skips all questions.',
      translationKey('Action.DismissQuestion', TranslationNamespace.AnalyticsAssistant),
    ),
    skipped: tPendingTranslation(
      'Skipped',
      'Status shown for a clarifying question the creator chose to skip.',
      translationKey('Label.QuestionSkipped', TranslationNamespace.AnalyticsAssistant),
    ),
    reviewTitle: tPendingTranslation(
      'Review',
      'Title of the step that summarizes the creator’s answers before submitting.',
      translationKey('Label.ReviewStep', TranslationNamespace.AnalyticsAssistant),
    ),
    continueAction: tPendingTranslation(
      'Continue',
      'Button that submits the reviewed answers to the assistant.',
      translationKey('Action.ContinueAnswers', TranslationNamespace.AnalyticsAssistant),
    ),
    edit: tPendingTranslation(
      'Edit',
      'Button on the review step that returns to the first question to change answers.',
      translationKey('Action.EditAnswers', TranslationNamespace.AnalyticsAssistant),
    ),
    navHint: tPendingTranslation(
      'Use arrows to navigate answers and sections',
      'Hint shown below a multi-question clarifying card explaining the navigation arrows.',
      translationKey('Label.QuestionNavHint', TranslationNamespace.AnalyticsAssistant),
    ),
  };
}

/**
 * The interactive clarifying-question card: a paginated question → Review flow.
 * Once the creator confirms or dismisses, `onSubmit` fires with the assembled
 * answer and the caller replaces the card with the answer turn — there is no
 * read-only mode.
 */
const AskQuestionCard: FC<AskQuestionCardProps> = ({ askQuestion, onSubmit, className }) => {
  const labels = useAskQuestionLabels();
  const state = useAskQuestionState({ askQuestion, onSubmit });
  const otherInputRef = useRef<HTMLInputElement>(null);
  const { currentQuestion } = state;
  const optionCount = currentQuestion?.options.length ?? 0;

  // Attached to a plain div (not a memoized child), so a stable identity buys
  // nothing — `state` is a fresh object each render, which would defeat useCallback anyway.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (state.isReview) {
      // ⌘/Ctrl+Enter always confirms; plain Enter confirms unless a button is focused (avoids double-firing Edit).
      const onButton = event.target instanceof HTMLButtonElement;
      if (event.key === ENTER_KEY && (event.metaKey || event.ctrlKey || !onButton)) {
        event.preventDefault();
        state.submit();
      }
      return;
    }
    // Number-key shortcuts on a question step, but never while typing free text
    // or holding a modifier (don't hijack ⌘/Ctrl/Alt+digit browser shortcuts).
    if (
      event.target instanceof HTMLInputElement ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      !DIGIT_KEY_PATTERN.test(event.key)
    ) {
      return;
    }
    const digit = Number(event.key);
    if (digit <= optionCount) {
      event.preventDefault();
      state.selectOptionByIndex(digit - 1);
    } else if (optionCount > 0 && digit === optionCount + 1) {
      // The badge after the last option addresses the "Other…" field.
      event.preventDefault();
      otherInputRef.current?.focus();
    }
  };

  return (
    <div className={className}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keydown provides number-key + confirm shortcuts; each control remains independently focusable/operable. */}
      <div className={CARD_CLASSNAME} onKeyDown={handleKeyDown}>
        <AskQuestionCardHeader
          title={state.isReview ? labels.reviewTitle : (currentQuestion?.prompt ?? '')}
          pagerLabel={state.pagerLabel}
          showArrows={state.canGoPrevious || state.canGoNext}
          canPrevious={state.canGoPrevious}
          canNext={state.canGoNext}
          previousLabel={labels.previousStep}
          nextLabel={labels.nextStep}
          closeLabel={labels.dismiss}
          onPrevious={state.goToPrevious}
          onNext={state.goToNext}
          onClose={state.dismiss}
        />
        <Divider />
        <div className={state.isReview ? REVIEW_CORE_CLASSNAME : CORE_CLASSNAME}>
          {state.isReview || currentQuestion === undefined ? (
            <AskQuestionReview
              answers={state.reviewAnswers}
              skippedText={labels.skipped}
              continueLabel={labels.continueAction}
              editLabel={labels.edit}
              onContinue={state.submit}
              onEdit={state.editFromReview}
            />
          ) : (
            <>
              {optionCount > 0 ? (
                <div className={OPTIONS_CLASSNAME}>
                  {currentQuestion.options.map((option, index) => (
                    <AskQuestionOptionRow
                      key={option.id}
                      badgeNumber={index + 1}
                      label={option.label}
                      description={option.description}
                      isSelected={state.currentSelection.optionIds.includes(option.id)}
                      onSelect={() => state.selectOption(option.id)}
                    />
                  ))}
                </div>
              ) : null}
              <AskQuestionOtherRow
                ref={otherInputRef}
                badgeNumber={optionCount > 0 ? optionCount + 1 : undefined}
                value={state.currentSelection.otherText ?? ''}
                placeholder={labels.otherPlaceholder}
                ariaLabel={labels.otherAriaLabel}
                skipLabel={labels.skip}
                onChange={state.setOtherText}
                onSkip={state.dismiss}
                onEnter={state.goToNext}
              />
            </>
          )}
        </div>
      </div>
      {state.isPaginated ? (
        <div className={HINT_CLASSNAME}>
          <span className='text-body-small content-muted'>{labels.navHint}</span>
        </div>
      ) : null}
    </div>
  );
};

export default AskQuestionCard;
