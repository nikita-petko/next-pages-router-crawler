import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Step, StepLabel, Stepper, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsExperimentsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import { useLatestConfigurations } from '../../hooks/useLatestConfigurations';
import {
  isExperimentEditable,
  isExperimentReschedulatbleOnly,
} from '../../utils/experimentProperties';
import ExperimentConfigurationStep from '../components/ExperimentConfigurationStep';
import ExperimentReviewStep from '../components/ExperimentSchedulingStep';
import ExperimentSetupStep from '../components/ExperimentSetupStep';
import ExperimentCreationFormProvider from '../context/ExperimentCreationFormProvider';
import { VariantsConfigurationForInExperienceProvider } from '../context/VariantsConfigurationForInExperienceProvider';
import { VariantsConfigurationForMatchmakingProvider } from '../context/VariantsConfigurationForMatchMakingProvider';
import useCreationStepAndQueryParams, {
  ExperimentCreationSteps,
  stepOrder,
} from '../hooks/useCreationStepAndQueryParams';
import useExperiment, { experimentIdPlaceholder } from '../hooks/useExperiment';

const ExperimentCreationPageContent: FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId, isLoading: isLoadingUniverse } = useUniverseResource();
  const { gameDetails } = useCurrentGame();
  const router = useRouter();

  const {
    activeStep,
    experimentType: experimentTypeFromQueryParams,
    experimentId,
    setExperimentType,
    setNextStep,
    setPrevStep,
    setActiveStep,
  } = useCreationStepAndQueryParams();

  const { rules: allConditionRules } = useLatestConfigurations({
    universeId: universeId ?? 0,
    isUniverseLoading: isLoadingUniverse,
  });
  const { experiment, isDataLoading: isExperimentPending } = useExperiment({
    experimentId: experimentId ?? experimentIdPlaceholder,
    refetchOnMount: true,
  });

  const experimentType = useMemo(() => {
    // When editing, prefer the experiment's actual type; otherwise,
    // use the type from the query params for new experiments
    return experiment?.experimentType ?? experimentTypeFromQueryParams;
  }, [experiment?.experimentType, experimentTypeFromQueryParams]);

  const VariantsConfigurationProvider = useMemo(() => {
    switch (experimentType) {
      case ExperimentProductType.Configs:
        return VariantsConfigurationForInExperienceProvider;
      case ExperimentProductType.Matchmaking:
        return VariantsConfigurationForMatchmakingProvider;
      default:
        throw new Error(`Unknown experiment type: ${String(experimentType)}`);
    }
  }, [experimentType]);

  const toExperimentPage = useCallback(() => {
    const href = buildExperienceAnalyticsUrlWithParams(
      analyticsExperimentsNavigationItem,
      {},
      universeId,
    );
    void router.push(href);
  }, [router, universeId]);

  // When an experiment can only be rescheduled, restrict navigation to the 'Review' step (the final step).
  useEffect(() => {
    if (!experiment) {
      return;
    }

    if (
      isExperimentReschedulatbleOnly(experiment.state) &&
      activeStep !== ExperimentCreationSteps.Review
    ) {
      setActiveStep(ExperimentCreationSteps.Review);
    }
  }, [activeStep, experiment, setActiveStep]);

  if (isLoadingUniverse) {
    return <PageLoading />;
  }

  if (experimentId) {
    if (isExperimentPending) {
      return <PageLoading />;
    }
    if (!experiment) {
      // Meaning user has given an invalid experiment id
      return <PageNotFound />;
    }

    if (!isExperimentEditable(experiment.state)) {
      return <PageNotFound />;
    }
  }

  return (
    <Grid container flexDirection='column'>
      <Grid item marginBottom={6}>
        <Typography variant='h2'>
          {translate(
            experimentId
              ? translationKey(
                  'Heading.ExperimentCreationInEditMode',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                )
              : translationKey(
                  'Heading.ExperimentCreation',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
          )}
        </Typography>
        <HubMeta
          title={buildTitle(
            translate(analyticsExperimentsNavigationItem.title),
            translate(
              experimentId
                ? translationKey(
                    'Heading.ExperimentCreationInEditMode',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  )
                : translationKey(
                    'Heading.ExperimentCreation',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
            ),
          )}
          type='experience'
          entityName={gameDetails?.name}
          entityId={gameDetails?.id?.toString()}
          author={gameDetails?.creator?.name}
        />
      </Grid>

      <Grid item marginBottom={4} maxWidth={900}>
        <Stepper activeStep={stepOrder.indexOf(activeStep)}>
          <Step>
            <StepLabel>
              {translate(
                translationKey(
                  'Label.ExperimentCreation.SetupAndEligibility',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              {translate(
                translationKey(
                  'Label.ExperimentCreation.ConfigsAndVariants',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              {translate(
                translationKey(
                  'Label.ExperimentCreation.Scheduling',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </StepLabel>
          </Step>
        </Stepper>
      </Grid>

      <VariantsConfigurationProvider>
        <ExperimentCreationFormProvider experimentType={experimentType} experiment={experiment}>
          <Grid item container>
            {activeStep === ExperimentCreationSteps.Setup && (
              <ExperimentSetupStep
                onNext={setNextStep}
                onCancel={toExperimentPage}
                experiment={experiment}
                setExperimentType={setExperimentType}
                allConditionRules={allConditionRules}
              />
            )}
            {activeStep === ExperimentCreationSteps.Configuration && (
              <ExperimentConfigurationStep
                onPrev={setPrevStep}
                onCancel={toExperimentPage}
                experimentType={experimentType}
                experiment={experiment}
                onNext={setNextStep}
              />
            )}
            {activeStep === ExperimentCreationSteps.Review && experiment && (
              <ExperimentReviewStep
                onPrev={setPrevStep}
                onCancel={toExperimentPage}
                experiment={experiment}
                onComplete={toExperimentPage}
              />
            )}
          </Grid>
        </ExperimentCreationFormProvider>
      </VariantsConfigurationProvider>
    </Grid>
  );
};

export default withTranslation(ExperimentCreationPageContent, [
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Navigation,
]);
