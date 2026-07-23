import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { UniverseAnalyticsTabLayoutProviders } from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsTabLayout';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ActiveExperimentSummaryAlert from '../components/ExperimentComponents/ActiveExperimentSummaryAlert';
import MatchmakingNavigation from '../components/MatchmakingNavigation';
import MatchmakingFeatureOptions from '../enums/MatchmakingFeatureOptions';
import useAttributesManagement from '../hooks/useAttributesManagement';
import useConfigurationManagement from '../hooks/useConfigurationManagement';
import useMatchmakingExperiments from '../hooks/useMatchmakingExperiments';
import MatchmakingAnalyticsContainer from './MatchmakingAnalyticsContainer';
import MatchmakingAttributesContainer from './MatchmakingAttributesContainer';
import MatchmakingConfigurationContainer from './MatchmakingConfigurationContainer';

const matchmakingFeatureOptionValues: readonly string[] = Object.values(MatchmakingFeatureOptions);

const isMatchmakingFeatureOption = (value: unknown): value is MatchmakingFeatureOptions => {
  return typeof value === 'string' && matchmakingFeatureOptionValues.includes(value);
};

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

  const { activeExperiment } = useMatchmakingExperiments();

  const router = useRouter();
  useEffect(() => {
    const { activeTab } = router.query;
    if (isMatchmakingFeatureOption(activeTab)) {
      setTabValue(activeTab);
    } else {
      setTabValue(MatchmakingFeatureOptions.Configuration);
    }
  }, [router]);

  const handleSelectTab = (value: MatchmakingFeatureOptions) => {
    void router.replace(
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
          <>
            <HubMeta hubOnly title={buildTitle(translate('Label.Configuration'))} />
            <MatchmakingConfigurationContainer error={fetchConfigurationsError} />
          </>
        );
      case MatchmakingFeatureOptions.Attributes:
        return (
          <>
            <HubMeta hubOnly title={buildTitle(translate('Label.Attributes'))} />
            <MatchmakingAttributesContainer
              currentPlayerAttributes={allPlayerBriefAttributes}
              currentServerAttributes={allServerAttributes}
              isLoadingAttributes={isLoadingAttributes}
            />
          </>
        );
      case MatchmakingFeatureOptions.Analytics:
        return (
          <>
            <HubMeta hubOnly title={buildTitle(translate('Label.Analytics'))} />
            <UniverseAnalyticsTabLayoutProviders>
              <MatchmakingAnalyticsContainer />
            </UniverseAnalyticsTabLayoutProviders>
          </>
        );
      default: {
        throw new Error('Unhandled tab value');
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
        {activeExperiment && (
          <ActiveExperimentSummaryAlert
            activeExperiment={activeExperiment}
            fetchConfigurationsError={fetchConfigurationsError}
            allConfigurationBriefInfoList={allConfigurationBriefInfoList ?? []}
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
