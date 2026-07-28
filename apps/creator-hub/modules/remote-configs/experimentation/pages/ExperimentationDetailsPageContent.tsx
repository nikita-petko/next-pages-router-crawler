import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Tab, Tabs } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { BannerCategory, StatusBanners } from '@modules/charts-generic/components/StatusBanner';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageLayout } from '@modules/charts-generic/layout/AnalyticsPageLayout';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import usersClient from '@modules/clients/users';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { useAnalyticsBannerConfiguration } from '@modules/experience-analytics-shared/hooks/useStatusConfiguration';
import { defaultAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { EmptyGrid, Link } from '@modules/miscellaneous/components';
import Flex from '@modules/miscellaneous/components/Flex';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUserUrl } from '@modules/miscellaneous/urls/www';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import {
  isExperimentEditable,
  isExperimentStartable,
  isExperimentStoppable,
} from '../../utils/experimentProperties';
import StartExperimentButton from '../components/StartExperimentButton';
import StopExperimentButton from '../components/StopExperimentButton';
import ToExperimentCreateOrEditPageButton from '../components/ToExperimentCreateOrEditPageButton';
import { VariantsConfigurationForInExperienceProvider } from '../context/VariantsConfigurationForInExperienceProvider';
import { VariantsConfigurationForMatchmakingProvider } from '../context/VariantsConfigurationForMatchMakingProvider';
import useExperiment from '../hooks/useExperiment';
import { ExperimentDetailsTab } from '../types/UIEnums';
import ExperimentationDetailsTab from './ExperimentationDetailsTab';
import ExperimentationResultsTab from './ExperimentationResultsTab';

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
    return (
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
    );
  }, [experimentCreator?.displayName, experimentCreator?.id, translateHTML]);

  const action = useMemo(() => {
    const isEditable = experiment && isExperimentEditable(experiment.state);
    const isStoppable = experiment && isExperimentStoppable(experiment.state);
    const isStartable = experiment && isExperimentStartable(experiment.state);

    if (!isEditable && !isStoppable && !isStartable) {
      return;
    }

    return (
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
    );
  }, [experiment, experimentId, translate]);

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
        <AnalyticsPageLayout
          title={title}
          description={description}
          action={action}
          banners={banners}>
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
