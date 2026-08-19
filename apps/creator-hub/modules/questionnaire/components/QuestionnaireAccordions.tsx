import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Typography } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  DeepValidatedQuestionnaire,
  QuestionnaireResponseErrors,
  ValidatedAnswer,
  ValidatedGeneralQuestion,
  ValidatedSection,
} from '../interfaces/types';
import useMarkdownParser from '../parser/useMarkdownParser';
import findNextSectionAfterComplete from '../utils/findNextSectionAfterComplete';
import isSectionComplete from '../utils/isSectionComplete';
import {
  buildUpdatedAnswers,
  shouldAutoAdvanceAfterAnswer,
} from '../utils/questionnaireAnswerUpdate';
import QuestionnaireAccordion from './QuestionnaireAccordion';

type TQuestionnaireAccordionsProps = {
  questionnaire: DeepValidatedQuestionnaire;
  answers: ValidatedAnswer[];
  errors: QuestionnaireResponseErrors;
  isSaving: boolean;
  setAnswers: (questionId: string, answers: ValidatedAnswer[]) => void;
  send: VoidFunction;
  save: (answers?: ValidatedAnswer[]) => Promise<boolean>;
  goToLanding: VoidFunction;
  omitActionBar?: boolean;
  onExpandedSectionChange?: (sectionId: string | null) => void;
  violatedSectionIds?: Set<string>;
};

// Scrolls to the section after the accordion collapse animation completes (~300ms) so
// the target's position is stable. Manually offsets for any sticky elements (e.g. the
// stepper bar) pinned at the top of the scroll container so the header isn't hidden behind them.
const scrollToSectionAfterAnimation = (id: string): void => {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }

    // Walk up to the nearest scrollable ancestor.
    let scrollParent: HTMLElement | null = el.parentElement;
    while (scrollParent) {
      const { overflowY } = window.getComputedStyle(scrollParent);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }

    if (!scrollParent) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }

    const containerRect = scrollParent.getBoundingClientRect();

    // Sum the height of sticky elements pinned to the top of the scroll container
    // (e.g. the questionnaire stepper bar). Check computed CSS `top` instead of
    // viewport position so padding on the scroll container doesn't fool the check.
    let stickyOffset = 0;
    scrollParent.querySelectorAll<HTMLElement>('.sticky').forEach((stickyEl) => {
      const style = window.getComputedStyle(stickyEl);
      const topValue = parseFloat(style.top);
      if (style.position === 'sticky' && topValue <= 0) {
        stickyOffset = Math.max(stickyOffset, stickyEl.offsetHeight);
      }
    });

    const elRect = el.getBoundingClientRect();
    scrollParent.scrollTo({
      top: scrollParent.scrollTop + elRect.top - containerRect.top - stickyOffset,
      behavior: 'smooth',
    });
  }, 300);
};

const QuestionnaireAccordions: FunctionComponent<TQuestionnaireAccordionsProps> = ({
  questionnaire,
  answers,
  errors,
  isSaving,
  setAnswers,
  send,
  save,
  goToLanding,
  omitActionBar,
  onExpandedSectionChange,
  violatedSectionIds,
}) => {
  const sectionsCount = questionnaire.sections.length;
  const { parseText } = useMarkdownParser();
  const { translate } = useTranslation();
  const description = questionnaire.sections[0]?.description;

  const sectionIds = useMemo(
    () => questionnaire.sections.map(({ id }) => id),
    [questionnaire.sections],
  );
  const [expanded, setExpanded] = useState<string | null>(() => sectionIds[0] ?? null);

  // Ensure the first section is expanded when the questionnaire loads or changes.
  useEffect(() => {
    if (!sectionIds.length) {
      return;
    }
    // Only force an initial expansion if nothing is expanded yet and the user
    // hasn't explicitly collapsed all accordions (expanded === null).
    if (expanded === null) {
      return;
    }
    if (!expanded || !sectionIds.includes(expanded)) {
      // oxlint-disable-next-line react/react-compiler -- syncing expanded with questionnaire section list on external change
      setExpanded(sectionIds[0]);
    }
  }, [expanded, sectionIds]);

  useEffect(() => {
    onExpandedSectionChange?.(expanded);
  }, [expanded, onExpandedSectionChange]);

  useLayoutEffect(() => {
    if (!violatedSectionIds?.size) {
      return;
    }
    const firstViolated = sectionIds.find((id) => violatedSectionIds.has(id));
    if (firstViolated) {
      // oxlint-disable-next-line react/react-compiler -- syncing expanded to first violated section on prop change
      setExpanded(firstViolated);
      scrollToSectionAfterAnimation(firstViolated);
    }
  }, [violatedSectionIds, sectionIds]);

  const onComplete = useCallback(
    (newAnswers?: ValidatedAnswer[]) => {
      const answersToCheck = newAnswers ?? answers;
      const { sections } = questionnaire;
      const currentIndex = sections.findIndex((section) => section.id === expanded);
      const nextSection = findNextSectionAfterComplete({
        sections,
        currentIndex,
        answers: answersToCheck,
        violatedSectionIds,
      });

      if (nextSection) {
        setExpanded(nextSection.id);
        scrollToSectionAfterAnimation(nextSection.id);
      } else {
        setExpanded(null);
      }
    },
    [expanded, answers, questionnaire, violatedSectionIds],
  );

  const updateAnswerWrapper = useCallback(
    (sectionId: string, questionId: string, value: string, unusedChildrenQuestionIds: string[]) => {
      const section = questionnaire.sections.find((s) => s.id === sectionId);
      const newAnswers = buildUpdatedAnswers(answers, questionId, value, unusedChildrenQuestionIds);

      setAnswers(questionId, newAnswers);
      // Every time there is an update to a question's answer, save that state, so upon revisiting, the updated answers are present
      void save(newAnswers);

      if (
        shouldAutoAdvanceAfterAnswer({
          section,
          priorAnswers: answers,
          newAnswers,
          questionId,
        })
      ) {
        onComplete(newAnswers);
      }
    },
    [answers, onComplete, questionnaire.sections, save, setAnswers],
  );

  const queryClient = useQueryClient();
  const onSaveDraft = useCallback(async () => {
    // Await both of the following to make sure landing is updated before
    // actually going there.
    await save();
    // Used to ensure the Landing text is updated to say there's a New Submission Not Completed
    // Ideally would be in the useMutation's onSuccess, like submit, but that
    // causes a refresh whenever each individual question is completed, which
    // causes weird state desyncs that the currenct code doesn't account for.
    await queryClient.invalidateQueries({ queryKey: ['experienceQuestionnaire'] });
    goToLanding();
  }, [goToLanding, queryClient, save]);

  const { completedSectionsMap, completedSectionsCount } = useMemo(() => {
    const sectionsMap: Record<string, boolean> = {};
    let count = 0;
    questionnaire.sections.forEach((section) => {
      const isComplete = isSectionComplete(section, answers);
      sectionsMap[section.id] = isComplete;
      if (isComplete) {
        count += 1;
      }
    });

    return {
      completedSectionsMap: sectionsMap,
      completedSectionsCount: count,
    };
  }, [answers, questionnaire.sections]);

  if (!sectionsCount) {
    return null;
  }

  return (
    <>
      <Typography>
        {translate('Label.SectionsCompleted', {
          completed: completedSectionsCount.toString(),
          total: sectionsCount.toString(),
        })}
      </Typography>
      {description && <div>{parseText(description)}</div>}
      <div>
        {questionnaire.sections.map(({ id, name, questions }: ValidatedSection) => {
          return (
            <QuestionnaireAccordion
              key={id}
              id={id}
              name={name}
              errors={errors}
              answers={answers}
              completed={completedSectionsMap[id]}
              violated={violatedSectionIds?.has(id)}
              // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- ValidatedSection.questions are ValidatedGeneralQuestion[]
              questions={questions as ValidatedGeneralQuestion[]}
              expanded={expanded === id}
              onChange={(sectionId: string) => {
                setExpanded((prev) => (prev === sectionId ? null : sectionId));
              }}
              updateAnswer={(
                questionId: string,
                value: string,
                unusedChildrenQuestionIds: string[],
              ) => {
                updateAnswerWrapper(id, questionId, value, unusedChildrenQuestionIds);
              }}
            />
          );
        })}
      </div>
      {!omitActionBar && (
        <Flex gap={12}>
          <Button
            disabled={completedSectionsCount !== sectionsCount || isSaving}
            variant='contained'
            color='primaryBrand'
            loading={isSaving}
            onClick={send}>
            {translate('Button.Continue')}
          </Button>
          <Button
            disabled={isSaving}
            loading={isSaving}
            variant='contained'
            color='secondary'
            onClick={onSaveDraft}>
            {translate('Action.SaveDraft')}
          </Button>
        </Flex>
      )}
    </>
  );
};

export default withTranslation(QuestionnaireAccordions, [
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.CommonUIControls,
  TranslationNamespace.Controls,
]);
