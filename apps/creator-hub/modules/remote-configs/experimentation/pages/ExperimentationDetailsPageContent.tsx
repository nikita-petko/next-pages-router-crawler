import React, { useCallback, useMemo } from 'react';
import {
  AnalyticsContextLayerInnerProvider,
  defaultAnalyticsPageSurfaceConfig,
  useAnalyticsBannerConfiguration,
} from '@modules/experience-analytics-shared';
import {
  AnalyticsPageDescription,
  AnalyticsPageLayout,
  AnalyticsPageTitle,
  AnalyticsQueryParams,
  BannerCategory,
  StatusBanners,
} from '@modules/charts-generic';
import { CircularProgress, Grid, Tab, Tabs } from '@rbx/ui';
import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useQuery } from '@tanstack/react-query';
import { usersClient } from '@modules/clients';
import { Flex } from '@modules/miscellaneous/common/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { EmptyGrid, Link } from '@modules/miscellaneous/common';
import { getUserUrl } from '@modules/miscellaneous/common/urls/www';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import {
  isExperimentEditable,
  isExperimentStartable,
  isExperimentStoppable,
} from '../../utils/experimentProperties';
import ExperimentationDetailsTab from './ExperimentationDetailsTab';
import useExperiment from '../hooks/useExperiment';
import ExperimentationResultsTab from './ExperimentationResultsTab';
import StopExperimentButton from '../components/StopExperimentButton';
import ToExperimentCreateOrEditPageButton from '../components/ToExperimentCreateOrEditPageButton';
import StartExperimentButton from '../components/StartExperimentButton';
import { VariantsConfigurationForMatchmakingProvider } from '../context/VariantsConfigurationForMatchMakingProvider';
import { VariantsConfigurationForInExperienceProvider } from '../context/VariantsConfigurationForInExperienceProvider';
import { ExperimentDetailsTab } from '../types/UIEnums';

const emptyArray: never[] = [];

const experimentDetailsTabs = [
  {
    value: ExperimentDetailsTab.DetailsAndProgress,
    labelKey: translationKey(
      'Label.DetailsAndProgress',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  },
  {
    value: ExperimentDetailsTab.Results,
    labelKey: translationKey(
      'Label.Results',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  },
] as const;

type ExperimentationDetailsPageContentProps = {
  experimentId: string;
};

const ExperimentationDetailsPageContent = ({
  experimentId,
}: ExperimentationDetailsPageContentProps) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { experiment, ...experimentQueryState } = useExperiment({
    experimentId,
  });

  const { data: experimentCreator } = useQuery({
    queryKey: ['get-experiment-creator', experiment?.createdBy],
    queryFn: () => usersClient.getUserById(experiment!.createdBy as unknown as number),
    enabled: !!experiment?.createdBy,
  });

  const VariantsConfigurationProvider = useMemo(() => {
    if (!experiment?.experimentType) {
      return VariantsConfigurationForInExperienceProvider;
    }

    const { experimentType } = experiment;

    switch (experimentType) {
      case ExperimentProductType.Configs:
        return VariantsConfigurationForInExperienceProvider;
      case ExperimentProductType.Matchmaking:
        return VariantsConfigurationForMatchmakingProvider;
      default: {
        const exhaustiveCheck: never = experimentType;
        throw new Error(`Unknown experiment type: ${exhaustiveCheck}`);
      }
    }
  }, [experiment]);

  const title = useMemo(
    () => <AnalyticsPageTitle text={(experiment?.name ?? '') as FormattedText} />,
    [experiment],
  );

  const description = useMemo(() => {
    const isEditable = experiment && isExperimentEditable(experiment.state);
    const isStoppable = experiment && isExperimentStoppable(experiment.state);
    const isStartable = experiment && isExperimentStartable(experiment.state);

    return (
      <Flex justifyContent='space-between' alignItems='center'>
        <AnalyticsPageDescription
          text={translateHTML(
            translationKey(
              'Description.Page.ExperimentationDetailsWithUser',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            [
              {
                opening: 'userLinkStart',
                closing: 'userLinkEnd',
                content: () =>
                  experimentCreator?.id ? (
                    <Link href={getUserUrl(experimentCreator.id)} target='_blank'>
                      {experimentCreator?.displayName}
                    </Link>
                  ) : null,
              },
            ],
          )}
        />
        <Flex gap={8}>
          {isEditable && (
            <ToExperimentCreateOrEditPageButton
              label={translate(
                translationKey(
                  'Label.EditExperiment',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
              color='secondary'
              experiment={experiment}
            />
          )}
          {isStoppable && (
            <StopExperimentButton
              buttonLabel={translate(
                translationKey(
                  'Label.StopExperimentButton.StopExperiment',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
              buttonColor='secondary'
              buttonVariant='contained'
              experimentId={experimentId}
            />
          )}
          {isStartable && <StartExperimentButton experiment={experiment} />}
        </Flex>
      </Flex>
    );
  }, [
    experiment,
    experimentCreator?.displayName,
    experimentCreator?.id,
    experimentId,
    translate,
    translateHTML,
  ]);

  const [query, setQuery] = useQueryParams([AnalyticsQueryParams.ExperimentDetailsTab]);
  const selectedTab = useMemo(() => {
    const queryValue = query[AnalyticsQueryParams.ExperimentDetailsTab];
    const queryTab = Array.isArray(queryValue) ? queryValue[0] : queryValue;
    if (queryTab && isValidEnumValue(ExperimentDetailsTab, queryTab)) {
      return queryTab;
    }

    return ExperimentDetailsTab.DetailsAndProgress;
  }, [query]);
  const setSelectedTab = useCallback(
    (tab: ExperimentDetailsTab) => {
      setQuery({ [AnalyticsQueryParams.ExperimentDetailsTab]: tab });
    },
    [setQuery],
  );
  const handleSelectTab = useCallback(
    (_: React.SyntheticEvent, value: ExperimentDetailsTab) => {
      setSelectedTab(value);
    },
    [setSelectedTab],
  );

  const visibleMetrics = useMemo(() => {
    if (!experiment || selectedTab !== ExperimentDetailsTab.Results) {
      return emptyArray;
    }
    return Array.from(new Set([...experiment.goalMetrics, ...experiment.learningMetrics]));
  }, [experiment, selectedTab]);

  const { data: bannerConfigs } = useAnalyticsBannerConfiguration(
    visibleMetrics,
    undefined,
    BannerCategory.DataIssue,
  );
  const banners = useMemo(() => {
    return bannerConfigs.length ? <StatusBanners bannerConfigs={bannerConfigs} /> : undefined;
  }, [bannerConfigs]);

  const tabContent = useMemo(() => {
    if (!experiment) {
      return null;
    }

    switch (selectedTab) {
      case ExperimentDetailsTab.DetailsAndProgress:
        return <ExperimentationDetailsTab experimentId={experimentId} />;
      case ExperimentDetailsTab.Results:
        return <ExperimentationResultsTab experimentId={experimentId} />;
      default: {
        const exhaustiveCheck: never = selectedTab;
        throw new Error(`Unhandled tab: ${exhaustiveCheck}`);
      }
    }
  }, [experiment, selectedTab, experimentId]);

  if (experimentQueryState.isDataLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  return (
    <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
      <VariantsConfigurationProvider>
        <AnalyticsPageLayout title={title} description={description} banners={banners}>
          <Grid item XSmall={12} marginBottom='24px'>
            <Tabs value={selectedTab} onChange={handleSelectTab}>
              {experimentDetailsTabs.map(({ value, labelKey }) => (
                <Tab key={value} label={translate(labelKey)} value={value} />
              ))}
            </Tabs>
          </Grid>
          {tabContent}
        </AnalyticsPageLayout>
      </VariantsConfigurationProvider>
    </AnalyticsContextLayerInnerProvider>
  );
};

export default withTranslation(ExperimentationDetailsPageContent, [
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Analytics,
]);
