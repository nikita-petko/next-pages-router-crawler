import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';

import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid } from '@rbx/ui';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useRouter } from 'next/router';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { UniverseAnalyticsTabLayoutProviders } from '@modules/experience-analytics-shared';
import MatchmakingFeatureOptions from '../enums/MatchmakingFeatureOptions';
import MatchmakingNavigation from '../components/MatchmakingNavigation';
import MatchmakingAttributesContainer from './MatchmakingAttributesContainer';
import MatchmakingConfigurationContainer from './MatchmakingConfigurationContainer';
import MatchmakingAnalyticsContainer from './MatchmakingAnalyticsContainer';
import useConfigurationManagement from '../hooks/useConfigurationManagement';
import useAttributesManagement from '../hooks/useAttributesManagement';
import useMatchmakingExperiments from '../hooks/useMatchmakingExperiments';
import ActiveExperimentSummaryAlert from '../components/ExperimentComponents/ActiveExperimentSummaryAlert';

const MatchmakingContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { gameDetails, canConfigure } = useCurrentGame();
  const {
    fetchConfigurationsError,
    allConfigurationBriefInfoList,
    isLoadingConfigurationsForUniverse,
  } = useConfigurationManagement();
  const {
    allPlayerBriefAttributes,
    allServerAttributes,
    isLoadingPlayerAttributes,
    isLoadingServerAttributes,
    isUpdatingPlayerAttributes,
    isUpdatingServerAttributes,
  } = useAttributesManagement();
  const [tabValue, setTabValue] = useState<MatchmakingFeatureOptions>(
    MatchmakingFeatureOptions.Configuration,
  );

  const { isMatchmakingCustomizationExperimentsAllowed } = useFeatureFlagsForNamespace(
    ['isMatchmakingCustomizationExperimentsAllowed'],
    FeatureFlagNamespace.Matchmaking,
  );
  const { activeExperiment } = useMatchmakingExperiments();

  const router = useRouter();
  useEffect(() => {
    const { activeTab } = router.query;
    if (activeTab) {
      const matchmakingNavigationTab = activeTab as MatchmakingFeatureOptions;
      setTabValue(matchmakingNavigationTab);
    } else {
      setTabValue(MatchmakingFeatureOptions.Configuration);
    }
  }, [router]);

  const handleSelectTab = (value: MatchmakingFeatureOptions) => {
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          activeTab: value as string,
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const isLoadingAttributes =
    isLoadingPlayerAttributes ||
    isLoadingServerAttributes ||
    isUpdatingPlayerAttributes ||
    isUpdatingServerAttributes;

  const currentTab = useMemo(() => {
    switch (tabValue) {
      case MatchmakingFeatureOptions.Configuration:
        return (
          <React.Fragment>
            <HubMeta hubOnly title={buildTitle(translate('Label.Configuration'))} />
            <MatchmakingConfigurationContainer error={fetchConfigurationsError} />
          </React.Fragment>
        );
      case MatchmakingFeatureOptions.Attributes:
        return (
          <React.Fragment>
            <HubMeta hubOnly title={buildTitle(translate('Label.Attributes'))} />
            <MatchmakingAttributesContainer
              currentPlayerAttributes={allPlayerBriefAttributes}
              currentServerAttributes={allServerAttributes}
              isLoadingAttributes={isLoadingAttributes}
            />
          </React.Fragment>
        );
      case MatchmakingFeatureOptions.Analytics:
        return (
          <React.Fragment>
            <HubMeta hubOnly title={buildTitle(translate('Label.Analytics'))} />
            <UniverseAnalyticsTabLayoutProviders>
              <MatchmakingAnalyticsContainer />
            </UniverseAnalyticsTabLayoutProviders>
          </React.Fragment>
        );
      default: {
        const exhaustiveCheck: never = tabValue;
        throw new Error(`Unhandled tab value: ${exhaustiveCheck}`);
      }
    }
  }, [
    tabValue,
    translate,
    allPlayerBriefAttributes,
    allServerAttributes,
    isLoadingAttributes,
    fetchConfigurationsError,
  ]);

  if (canConfigure === false) {
    return <PageNotFound />;
  }

  return (
    <section>
      <Grid>
        {isMatchmakingCustomizationExperimentsAllowed && activeExperiment && (
          <ActiveExperimentSummaryAlert
            activeExperiment={activeExperiment}
            fetchConfigurationsError={fetchConfigurationsError}
            allConfigurationBriefInfoList={allConfigurationBriefInfoList || []}
            isLoadingConfigurations={isLoadingConfigurationsForUniverse}
          />
        )}
        <MatchmakingNavigation onSelectTab={handleSelectTab} currentTab={tabValue} />
      </Grid>
      {gameDetails && gameDetails.id && <Grid>{currentTab}</Grid>}
    </section>
  );
};

export default withTranslation(MatchmakingContainer, [TranslationNamespace.Matchmaking]);
