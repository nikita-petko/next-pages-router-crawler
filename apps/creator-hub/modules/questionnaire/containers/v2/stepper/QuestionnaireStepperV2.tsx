import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TStepperStep } from '@rbx/foundation-ui';
import { Stepper } from '@rbx/foundation-ui';
import { withTranslation, useLocalization, useTranslation } from '@rbx/intl';
import { useMediaQuery, useTheme } from '@rbx/ui';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import convertToRobloxLocale from '../../../utils/localizationHelper';
import { useLatestQuestionnaireId, useQuestionnaire, useAnswers } from '../../../utils/queries';
import AdditionalQuestionnaire from './AdditionalQuestionnaire';
import GuidanceSideSheet, { GuidanceFloatingButton } from './GuidanceSideSheet';
import MainQuestionnaire from './MainQuestionnaire';
import QuestionnairePreviewV2 from './QuestionnairePreviewV2';

function findScrollParent(node: HTMLElement): HTMLElement | null {
  let parent = node.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

interface QuestionnaireStepperV2Props {
  universeId: number;
  onComplete: () => void;
  onCancel: () => void;
}

const QuestionnaireStepperV2: FunctionComponent<QuestionnaireStepperV2Props> = ({
  universeId,
  onComplete,
  onCancel,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const localeCode = convertToRobloxLocale(locale);
  const {
    data: questionnaireIdData,
    isLoading: isQuestionnaireIdLoading,
    isError: isQuestionnaireIdError,
  } = useLatestQuestionnaireId(universeId);
  const questionnaireId = questionnaireIdData?.questionnaireId;
  const isOverEighteenQuestionnaire = questionnaireIdData?.isOverEighteenQuestionnaire ?? true;
  const {
    data: questionnaireData,
    isLoading: isQuestionnaireLoading,
    isError: isQuestionnaireError,
  } = useQuestionnaire(questionnaireId, localeCode);
  const { data: answersData } = useAnswers(universeId);
  const shouldUseAppTypeQuestion = (questionnaireData?.sections?.length ?? 0) === 1;
  const mainQuestionsLabel = isOverEighteenQuestionnaire
    ? translate('Stepper.IARCQuestions')
    : translate('Stepper.ContentQuestions');
  const steps: TStepperStep[] = useMemo(
    () =>
      shouldUseAppTypeQuestion
        ? [
            { label: translate('Stepper.AppType') },
            { label: mainQuestionsLabel },
            { label: translate('Stepper.RobloxQuestions') },
            { label: translate('Stepper.Preview') },
          ]
        : [
            { label: mainQuestionsLabel },
            { label: translate('Stepper.RobloxQuestions') },
            { label: translate('Stepper.Preview') },
          ],
    [shouldUseAppTypeQuestion, translate, mainQuestionsLabel],
  );
  const additionalStepIndex = shouldUseAppTypeQuestion ? 2 : 1;
  const previewStepIndex = shouldUseAppTypeQuestion ? 3 : 2;
  const [activeStep, setActiveStep] = useState(0);
  const [mainQuestionnaireId, setMainQuestionnaireId] = useState<string | null>(null);
  const [additionalQuestionnaireId, setAdditionalQuestionnaireId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 600px)');
  const theme = useTheme();
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(!isMobile);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [actionBarContainer, setActionBarContainer] = useState<HTMLDivElement | null>(null);
  const [isViolatingGuidelines, setIsViolatingGuidelines] = useState(false);
  const [violatedSectionIds, setViolatedSectionIds] = useState<Set<string>>(new Set());
  const [warningDismissed, setWarningDismissed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) {
      return undefined;
    }

    const scrollParent = findScrollParent(el);
    if (!scrollParent) {
      return undefined;
    }

    const update = () => {
      const scrollRect = scrollParent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetFromScrollTop = elRect.top - scrollRect.top + scrollParent.scrollTop;
      el.style.minHeight = `${scrollParent.clientHeight - offsetFromScrollTop}px`;
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(scrollParent);
    return () => observer.disconnect();
  }, []);

  // Wrapper that changes the step and resets the active section in the same
  // synchronous event-handler batch.  Using a useEffect to reset would race
  // with the child QuestionnaireAccordions effect that sets the initial
  // section on mount (React runs child effects before parent effects).
  const goToStep = useCallback((step: number | ((current: number) => number)) => {
    setActiveStep(step);
    setActiveSectionId(null);
    setIsViolatingGuidelines(false);
    setViolatedSectionIds(new Set());
    setWarningDismissed(false);
    document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo(0, 0);
  }, []);

  // Build a flat map of sectionId → RobloxGuidanceFormatted from all sections
  // (including child sections nested inside question options).
  const sectionGuidanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!questionnaireData?.sections) {
      return map;
    }

    const collectSections = (sections: typeof questionnaireData.sections) => {
      sections.forEach((section) => {
        if (section.id && section.metadata?.RobloxGuidanceFormatted) {
          map[section.id] = section.metadata.RobloxGuidanceFormatted;
        }
        if (section.questions) {
          section.questions.forEach((question) => {
            if ('options' in question && Array.isArray(question.options)) {
              (question.options as Array<{ childSections?: typeof questionnaireData.sections }>) // oxlint-disable-line typescript/no-unsafe-type-assertion -- narrowing options with childSections
                .forEach((option) => {
                  if (option.childSections) {
                    // oxlint-disable-next-line react/react-compiler -- recursive useMemo callback
                    collectSections(option.childSections);
                  }
                });
            }
          });
        }
      });
    };

    collectSections(questionnaireData.sections);
    return map;
  }, [questionnaireData]);

  // On step 0 (App Type), activeSectionId is null because MainQuestionnaire
  // only triggers onActiveSectionChange from the accordion in step 1.
  // Fall back to the first section's ID so guidance still appears.
  const appTypeSectionId = questionnaireData?.sections?.[0]?.id ?? null;
  const effectiveSectionId =
    activeSectionId ?? (shouldUseAppTypeQuestion && activeStep === 0 ? appTypeSectionId : null);
  const robloxGuidance = effectiveSectionId ? (sectionGuidanceMap[effectiveSectionId] ?? '') : '';

  const handleActiveSectionChange = useCallback((sectionId: string | null) => {
    setActiveSectionId(sectionId);
    setWarningDismissed(false);
  }, []);

  const handleViolation = useCallback((isViolating: boolean, violatedIds?: Set<string>) => {
    setIsViolatingGuidelines(isViolating);
    setViolatedSectionIds(violatedIds ?? new Set());
    setWarningDismissed(false);
    if (isViolating) {
      setIsSideSheetOpen(true);
    }
  }, []);

  const isActiveSectionViolated =
    isViolatingGuidelines && !!effectiveSectionId && violatedSectionIds.has(effectiveSectionId);
  const showViolationWarning = isActiveSectionViolated && !warningDismissed;

  const handleDismissWarning = useCallback(() => {
    setWarningDismissed(true);
  }, []);

  const isOnMainQuestionnaire = activeStep < additionalStepIndex;
  const hasGuidance = isOnMainQuestionnaire && !!robloxGuidance;

  useEffect(() => {
    if (!hasGuidance) {
      // oxlint-disable-next-line react/react-compiler -- syncing side sheet visibility to guidance/mobile state
      setIsSideSheetOpen(false);
      return;
    }
    setIsSideSheetOpen(!isMobile);
  }, [effectiveSectionId, isMobile, hasGuidance]);

  const handleMainQuestionnaireComplete = (id: string) => {
    setMainQuestionnaireId(id);
    goToStep(additionalStepIndex);
  };

  const handleAdditionalQuestionnaireComplete = (id: string) => {
    setAdditionalQuestionnaireId(id);
    goToStep(previewStepIndex);
  };

  const handlePublish = () => {
    // After publish, go back to overview
    onComplete();
  };

  if (isQuestionnaireIdError || isQuestionnaireError) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        onReload={() => window.location.reload()}
      />
    );
  }

  if (isQuestionnaireIdLoading || isQuestionnaireLoading || !questionnaireData) {
    return <PageLoading />;
  }

  return (
    <div ref={wrapperRef} className='flex flex-col'>
      <div className='flex gap-xlarge fill' style={{ alignItems: 'flex-start' }}>
        <div className='flex flex-col gap-xlarge min-width-[0px] fill'>
          <div
            className='sticky top-[0px] padding-y-medium'
            style={{
              zIndex: 10,
              backgroundColor: theme.palette.navigation.default,
              overflow: 'hidden',
            }}>
            <Stepper steps={steps} currentStepIndex={activeStep} size='Medium' />
          </div>

          {activeStep < additionalStepIndex && (
            <MainQuestionnaire
              universeId={universeId}
              activeStep={activeStep}
              onNext={() => goToStep((current) => current + 1)}
              onBack={() =>
                goToStep((current) => {
                  if (current <= 0) {
                    onCancel();
                    return 0;
                  }
                  return current - 1;
                })
              }
              onCancel={onCancel}
              onComplete={handleMainQuestionnaireComplete}
              onActiveSectionChange={handleActiveSectionChange}
              onViolation={handleViolation}
              actionBarContainer={actionBarContainer}
            />
          )}

          {activeStep === additionalStepIndex && (
            <AdditionalQuestionnaire
              universeId={universeId}
              onComplete={handleAdditionalQuestionnaireComplete}
              onBack={() => {
                const hasAnswers = answersData && answersData.length > 0;
                if (!hasAnswers) {
                  goToStep(0);
                } else {
                  goToStep(shouldUseAppTypeQuestion ? 1 : 0);
                }
              }}
              onCancel={onCancel}
              onViolation={handleViolation}
              actionBarContainer={actionBarContainer}
            />
          )}

          {activeStep === previewStepIndex && (
            <QuestionnairePreviewV2
              universeId={universeId}
              mainQuestionnaireId={mainQuestionnaireId ?? ''}
              additionalQuestionnaireId={additionalQuestionnaireId ?? ''}
              onPublish={handlePublish}
              onBack={() => goToStep(additionalStepIndex)}
              onCancel={onCancel}
              actionBarContainer={actionBarContainer}
              isOverEighteenQuestionnaire={isOverEighteenQuestionnaire}
            />
          )}
        </div>

        {hasGuidance && isSideSheetOpen && !isMobile && (
          <GuidanceSideSheet
            onClose={() => setIsSideSheetOpen(false)}
            robloxGuidance={robloxGuidance}
            showViolationWarning={showViolationWarning}
            onDismissWarning={handleDismissWarning}
            actionBarContainer={actionBarContainer}
          />
        )}

        {hasGuidance && isMobile && (
          <GuidanceSideSheet
            open={isSideSheetOpen}
            onClose={() => setIsSideSheetOpen(false)}
            robloxGuidance={robloxGuidance}
            showViolationWarning={showViolationWarning}
            onDismissWarning={handleDismissWarning}
            actionBarContainer={actionBarContainer}
          />
        )}

        {hasGuidance && !isSideSheetOpen && (
          <GuidanceFloatingButton
            onClick={() => setIsSideSheetOpen(true)}
            actionBarContainer={actionBarContainer}
          />
        )}
      </div>
      <div
        ref={(node: HTMLDivElement | null) => {
          setActionBarContainer(node);
        }}
        className='sticky bottom-[0px] padding-y-large'
        style={{
          zIndex: 10,
          backgroundColor: theme.palette.navigation.default,
        }}
      />
    </div>
  );
};

export default withTranslation(QuestionnaireStepperV2, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
