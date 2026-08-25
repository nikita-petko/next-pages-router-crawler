import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TStepperStep } from '@rbx/foundation-ui';
import { Stepper } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import QuestionnaireQuestionContainer from '../containers/QuestionnaireQuestionContainer';
import {
  QuestionnaireSectionTelemetryProvider,
  useQuestionnaireTelemetryContext,
} from '../contexts/QuestionnaireTelemetryContext';
import useTimedQuestionnaireView from '../hooks/useTimedQuestionnaireView';
import type {
  DeepValidatedQuestionnaire,
  DeepValidateSection,
  QuestionnaireResponseErrors,
  ValidatedAnswer,
} from '../interfaces/types';
import useMarkdownParser from '../parser/useMarkdownParser';
import findNextSectionAfterComplete from '../utils/findNextSectionAfterComplete';
import isSectionComplete from '../utils/isSectionComplete';
import {
  buildUpdatedAnswers,
  shouldAutoAdvanceAfterAnswer,
} from '../utils/questionnaireAnswerUpdate';

type TQuestionnaireSectionStepperProps = {
  questionnaire: DeepValidatedQuestionnaire;
  answers: ValidatedAnswer[];
  errors: QuestionnaireResponseErrors;
  isSaving: boolean;
  setAnswers: (questionId: string, answers: ValidatedAnswer[]) => void;
  send: VoidFunction;
  save: (answers?: ValidatedAnswer[]) => Promise<boolean>;
  goToLanding: VoidFunction;
};

type TActiveSectionProps = {
  section: DeepValidateSection;
  answers: ValidatedAnswer[];
  errors: QuestionnaireResponseErrors;
  updateAnswer: (questionId: string, value: string, unusedChildrenQuestionIds: string[]) => void;
};

// Renders the questions for the section on the active step. Mounted with a `key` of the
// section id so it remounts when the step changes, which resets the section-view telemetry
// timer (mirroring how a single accordion mounts/unmounts on expand/collapse).
const ActiveSection: FunctionComponent<TActiveSectionProps> = ({
  section,
  answers,
  errors,
  updateAnswer,
}) => {
  const { onSectionViewed } = useQuestionnaireTelemetryContext();
  const handleSectionViewEnd = useCallback(
    (timing: Parameters<NonNullable<typeof onSectionViewed>>[1]) => {
      onSectionViewed?.(section.id, timing);
    },
    [section.id, onSectionViewed],
  );
  useTimedQuestionnaireView(!!onSectionViewed, handleSectionViewEnd);

  return (
    <QuestionnaireSectionTelemetryProvider isActive>
      {section.questions.map((question) => (
        <QuestionnaireQuestionContainer
          key={question.id}
          errors={errors}
          validatedAnswers={answers}
          question={question}
          updateAnswer={updateAnswer}
        />
      ))}
    </QuestionnaireSectionTelemetryProvider>
  );
};

const QuestionnaireSectionStepper: FunctionComponent<TQuestionnaireSectionStepperProps> = ({
  questionnaire,
  answers,
  errors,
  isSaving,
  setAnswers,
  send,
  save,
  goToLanding,
}) => {
  const { translate } = useTranslation();
  const { parseText } = useMarkdownParser();
  const queryClient = useQueryClient();
  const { sections } = questionnaire;
  const sectionsCount = sections.length;
  const introDescription = sections[0]?.description;

  const [activeStep, setActiveStep] = useState(() => {
    if (!sections.length) {
      return 0;
    }
    const firstIncompleteIndex = sections.findIndex(
      (section) => !isSectionComplete(section, answers),
    );
    if (firstIncompleteIndex >= 0) {
      return firstIncompleteIndex;
    }
    return sections.length - 1;
  });
  // Clamp the active step if the questionnaire's sections change out from under us.
  const clampedStep = Math.min(activeStep, Math.max(sectionsCount - 1, 0));
  const activeSection = sections[clampedStep];
  const isLastStep = clampedStep === sectionsCount - 1;
  const isActiveSectionComplete = activeSection ? isSectionComplete(activeSection, answers) : false;

  const { steps, completedSectionsCount } = useMemo(() => {
    const completion = sections.map((section) => isSectionComplete(section, answers));
    const nextSteps: TStepperStep[] = sections.map((section, index) => ({
      id: section.id,
      label: section.name,
      state: index === clampedStep ? 'current' : completion[index] ? 'complete' : 'upcoming',
    }));
    return {
      steps: nextSteps,
      completedSectionsCount: completion.filter(Boolean).length,
    };
  }, [sections, answers, clampedStep]);

  const onSectionComplete = useCallback(
    (newAnswers: ValidatedAnswer[]) => {
      const nextSection = findNextSectionAfterComplete({
        sections,
        currentIndex: clampedStep,
        answers: newAnswers,
      });

      if (nextSection) {
        const nextIndex = sections.findIndex((section) => section.id === nextSection.id);
        if (nextIndex >= 0) {
          setActiveStep(nextIndex);
        }
        return;
      }

      if (clampedStep < sectionsCount - 1) {
        setActiveStep((step) => Math.min(step + 1, sectionsCount - 1));
      }
    },
    [clampedStep, sections, sectionsCount],
  );

  const updateAnswer = useCallback(
    (questionId: string, value: string, unusedChildrenQuestionIds: string[]) => {
      const section = sections[clampedStep];
      const newAnswers = buildUpdatedAnswers(answers, questionId, value, unusedChildrenQuestionIds);

      setAnswers(questionId, newAnswers);
      // Persist on every answer change so revisiting the questionnaire restores progress.
      void save(newAnswers);

      if (
        shouldAutoAdvanceAfterAnswer({
          section,
          priorAnswers: answers,
          newAnswers,
          questionId,
        })
      ) {
        onSectionComplete(newAnswers);
      }
    },
    [answers, clampedStep, onSectionComplete, save, sections, setAnswers],
  );

  const onSaveDraft = useCallback(async () => {
    // Await both of the following to make sure landing is updated before actually going there.
    await save();
    // Used to ensure the Landing text is updated to say there's a New Submission Not Completed.
    await queryClient.invalidateQueries({ queryKey: ['experienceQuestionnaire'] });
    goToLanding();
  }, [goToLanding, queryClient, save]);

  if (!sectionsCount || !activeSection) {
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
      {introDescription && <div>{parseText(introDescription)}</div>}
      <Stepper steps={steps} currentStepIndex={clampedStep} size='Medium' />
      <ActiveSection
        key={activeSection.id}
        section={activeSection}
        answers={answers}
        errors={errors}
        updateAnswer={updateAnswer}
      />
      <div className='flex gap-small'>
        <Button
          disabled={clampedStep === 0 || isSaving}
          variant='outlined'
          color='secondary'
          onClick={() => setActiveStep((step) => Math.max(step - 1, 0))}>
          {translate('Button.Back')}
        </Button>
        {!isLastStep && (
          <Button
            disabled={!isActiveSectionComplete || isSaving}
            variant='contained'
            color='primaryBrand'
            onClick={() => setActiveStep((step) => Math.min(step + 1, sectionsCount - 1))}>
            {translate('Button.Next')}
          </Button>
        )}
        {isLastStep && (
          <Button
            disabled={completedSectionsCount !== sectionsCount || isSaving}
            variant='contained'
            color='primaryBrand'
            loading={isSaving}
            onClick={send}>
            {translate('Button.Continue')}
          </Button>
        )}
        <Button
          disabled={isSaving}
          loading={isSaving}
          variant='contained'
          color='secondary'
          onClick={onSaveDraft}>
          {translate('Action.SaveDraft')}
        </Button>
      </div>
    </>
  );
};

export default withTranslation(QuestionnaireSectionStepper, [
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.CommonUIControls,
  TranslationNamespace.Controls,
  TranslationNamespace.Navigation,
]);
