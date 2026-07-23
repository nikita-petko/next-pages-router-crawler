import type { FunctionComponent } from 'react';
import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Divider, Grid } from '@rbx/ui';
import {
  isAnalyticsAssistantChatEnabled as isAnalyticsAssistantChatEnabledFlag,
  isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag,
  isExperienceAlertsEnabled,
  isJourneyEventsEnabled as isJourneysEnabledFlag,
  showVideoServiceDashboard as showVideoServiceDashboardFlag,
} from '@generated/flags/creatorAnalytics';
import { isLeaderboardConfigsEnabled as isLeaderboardConfigsEnabledFlag } from '@generated/flags/leaderboards';
import { useAuthentication } from '@modules/authentication/providers';
import coreContentClient from '@modules/clients/coreContent';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useDashboardsListQuery } from '@modules/experience-analytics/custom-dashboards/hooks/useDashboardsListQuery';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { useStudioEditPlaceLauncher } from '@modules/miscellaneous/hooks';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import Features from '@modules/navigation/leftNavigation/components/Features';
import { useCreatorGameopsFlags } from '@modules/player-support/flags/useCreatorGameopsFlags';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useSocialLinksBehavior from '@modules/social-links/hooks/useSocialLinksBehavior';
import GameStatus from '../../game/components/GameStatus';
import type { CreationsFeatureSettings } from '../creationsFeatureManager';
import {
  creationsFeatureManager,
  GameLeftNavigationSectionTitleKeys,
} from '../creationsFeatureManager';
import {
  useCreationsCustomSettings,
  CreationsCustomSettingsProvider,
} from '../implementations/creationsCustomSettings';

type GameLeftNavigationProps = {
  readonly pinnedDashboardFeatures?: Feature<CreationsFeatureSettings>[];
};

const EMPTY_PINNED_DASHBOARD_FEATURES: Feature<CreationsFeatureSettings>[] = [];

const filterDisabledItems = (
  features: Feature<CreationsFeatureSettings>[],
  settings?: CreationsFeatureSettings,
) => {
  const filter = (feats: Feature<CreationsFeatureSettings>[]) => {
    return feats.reduce((accumulator, currentFeature) => {
      if (currentFeature.isEnabledOnSettings?.(settings) ?? true) {
        let feature: Feature<CreationsFeatureSettings> = currentFeature;

        if (currentFeature.subFeatures) {
          feature = {
            ...currentFeature,
            subFeatures: filter([...currentFeature.subFeatures]),
          };
        }
        accumulator.push(feature);
      }

      return accumulator;
    }, [] as Feature<CreationsFeatureSettings>[]);
  };

  return filter(features);
};

const GameLeftNavigation: FunctionComponent<React.PropsWithChildren<GameLeftNavigationProps>> = ({
  pinnedDashboardFeatures = EMPTY_PINNED_DASHBOARD_FEATURES,
}) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { open, dialog, isCompatible } = useStudio();
  const { gameDetails, canConfigure } = useCurrentGame();
  const { data: permissions } = useUniversePermissions(gameDetails?.id);
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const { permissions: orgPermissions } = useCurrentOrganization();
  const { shouldUseV2: shouldUseQuestionnaireV2 } = useQuestionnaireV2Gate();
  const {
    data: { shouldHideSocialLinksSection },
  } = useSocialLinksBehavior();

  const { settings, isFetched } = useSettings();
  const creationsCustomSettings = useCreationsCustomSettings();
  const {
    isPending: isPendingAnalyticsExperiencePermissions,
    isError: _isAnalyticsExperiencePermissionsError,
    experienceHasPerformanceMonitoringAccess: _experienceHasPerformanceMonitoringAccess,
    experienceHasExperimentationMinDau: _experienceHasExperimentationMinDau,
    experienceHasNoInGameExperiment: _experienceHasNoInGameExperiment,
    ...analyticsUserPermissions
  } = useAnalyticsExperiencePermissions(gameDetails?.id ?? uninitializedUniverseId);
  const { enablePlayerSupport } = useCreatorGameopsFlags('enablePlayerSupport', {
    universeId: gameDetails?.id ?? 0,
  });
  const { ready: isExperienceAlertsReady, value: isExperienceAlertsEnabledFlag } = useFlag(
    isExperienceAlertsEnabled,
    {
      universeId: gameDetails?.id ?? 0,
    },
  );
  const { ready: isAnalyticsAssistantChatReady, value: isAnalyticsAssistantChatEnabledValue } =
    useFlag(isAnalyticsAssistantChatEnabledFlag);
  const { ready: isCustomDashboardsReady, value: isCustomDashboardsEnabledValue } = useFlag(
    isCustomDashboardsEnabledFlag,
  );
  const { ready: isLeaderboardConfigsReady, value: isLeaderboardConfigsEnabledValue } = useFlag(
    isLeaderboardConfigsEnabledFlag,
  );
  const { ready: isJourneysReady, value: isJourneysEnabledValue } = useFlag(isJourneysEnabledFlag);
  const { ready: showVideoServiceDashboardReady, value: showVideoServiceDashboardValue } = useFlag(
    showVideoServiceDashboardFlag,
  );
  const { launch } = useStudioEditPlaceLauncher();
  const { data: eligibilityData } = useQuery({
    queryKey: ['coreContentBatchGetUniversePublishEligibility', gameDetails?.id ?? 0],
    queryFn: () =>
      coreContentClient.coreContentBatchGetUniversePublishEligibility({
        coreContentBatchGetUniversePublishEligibilityRequest: {
          universeIds: [gameDetails?.id ?? 0],
        },
      }),
    enabled: !!gameDetails?.id,
  });
  const canGetSelectEligibilityData = useMemo(() => {
    if (
      !(
        eligibilityData &&
        gameDetails &&
        gameDetails.id &&
        eligibilityData.universeEligibilities[gameDetails.id.toString()]
      )
    ) {
      return false;
    }
    return (
      eligibilityData.universeEligibilities[gameDetails.id.toString() ?? '']?.indicator !== null &&
      eligibilityData.universeEligibilities[gameDetails.id.toString() ?? '']?.indicator !==
        undefined
    );
  }, [eligibilityData, gameDetails]);

  const featureManager = creationsFeatureManager;
  const allFeatures = featureManager.getAllFeatures();
  const enabledFeatures = useMemo(() => {
    const isExperienceCreatedByCurrentUser =
      gameDetails?.creator?.type === 'User' && gameDetails?.creator?.id === user?.id;
    const isExperienceCreatedByCurrentGroup =
      gameDetails?.creator?.type === 'Group' && gameDetails?.creator?.id === currentGroup?.id;
    const canManageWebhooks =
      isExperienceCreatedByCurrentUser ||
      (permissions != null && 'manageWebhooks' in permissions && permissions.manageWebhooks);
    const mergedSettings =
      (!isFetched || isPendingAnalyticsExperiencePermissions) && canConfigure !== null
        ? undefined
        : {
            ...settings,
            ...creationsCustomSettings,
            ...analyticsUserPermissions,
            isAnalyticsAssistantChatEnabled:
              isAnalyticsAssistantChatReady && isAnalyticsAssistantChatEnabledValue,
            isCustomDashboardsEnabled: isCustomDashboardsReady && isCustomDashboardsEnabledValue,
            isLeaderboardConfigsEnabled:
              isLeaderboardConfigsReady && isLeaderboardConfigsEnabledValue,
            isJourneysEnabled: isJourneysReady && isJourneysEnabledValue,
            showVideoServiceDashboard:
              showVideoServiceDashboardReady && showVideoServiceDashboardValue,
            isExperienceAlertsEnabled: isExperienceAlertsReady && isExperienceAlertsEnabledFlag,
            enablePlayerSupport: enablePlayerSupport ?? false,
            isStudioCompatible: isCompatible,
            canConfigure: canConfigure ?? false,
            permissions: permissions ?? null,
            canConfigureExperienceEvents:
              isExperienceCreatedByCurrentUser ||
              orgPermissions?.canManageExperienceEvents === true,
            canManageWebhooks,
            locale,
            isExperienceCreatedByCurrentUserOrGroup:
              isExperienceCreatedByCurrentUser || isExperienceCreatedByCurrentGroup,
            shouldUseQuestionnaireV2,
            shouldHideSocialLinksSection,
            canGetSelectEligibilityData,
          };
    const filterFeatures = filterDisabledItems(allFeatures, mergedSettings);

    const mapFeature = (currentFeature: Feature<CreationsFeatureSettings>) => {
      switch (currentFeature.key) {
        case 'editInStudio':
          if (settings.enableUseStudioEditPlaceLauncherWithPrelaunch) {
            return {
              ...currentFeature,
              onSelectFeature: () => launch(gameDetails?.id ?? 0, gameDetails?.rootPlaceId ?? 0),
            };
          }
          return {
            ...currentFeature,
            onSelectFeature: () =>
              open({
                task: EStudioTaskType.EditPlace,
                universeId: gameDetails?.id?.toString() ?? '',
                placeId: gameDetails?.rootPlaceId?.toString() ?? '',
              }),
          };
        case 'sponsor':
          return {
            ...currentFeature,
            getExternalPath: () => {
              if (!gameDetails?.id) {
                return '';
              }
              return currentFeature.getExternalPath?.(gameDetails.id) ?? '';
            },
          };
        case 'viewOnRobloxLink':
          return {
            ...currentFeature,
            getExternalPath: () => {
              if (!gameDetails?.rootPlaceId) {
                return '';
              }
              return currentFeature.getExternalPath?.(gameDetails.rootPlaceId) ?? '';
            },
          };
        default:
          return currentFeature;
      }
    };

    const mappedFeatures = filterFeatures.map((currentFeature) => {
      let feature = currentFeature;
      if (currentFeature.subFeatures != null) {
        const subFeatures =
          currentFeature.key === 'customDashboardsCategory' && pinnedDashboardFeatures.length > 0
            ? currentFeature.subFeatures.concat(pinnedDashboardFeatures)
            : currentFeature.subFeatures;
        feature = {
          ...currentFeature,
          subFeatures: subFeatures.map(mapFeature),
        };
      }
      return mapFeature(feature);
    });

    return mappedFeatures;
  }, [
    gameDetails,
    user?.id,
    currentGroup?.id,
    isFetched,
    canConfigure,
    settings,
    creationsCustomSettings,
    analyticsUserPermissions,
    isPendingAnalyticsExperiencePermissions,
    isAnalyticsAssistantChatReady,
    isAnalyticsAssistantChatEnabledValue,
    isCustomDashboardsReady,
    isCustomDashboardsEnabledValue,
    isLeaderboardConfigsReady,
    isLeaderboardConfigsEnabledValue,
    isJourneysReady,
    isJourneysEnabledValue,
    showVideoServiceDashboardReady,
    showVideoServiceDashboardValue,
    isExperienceAlertsReady,
    isExperienceAlertsEnabledFlag,
    enablePlayerSupport,
    isCompatible,
    permissions,
    orgPermissions?.canManageExperienceEvents,
    locale,
    shouldUseQuestionnaireV2,
    allFeatures,
    launch,
    open,
    shouldHideSocialLinksSection,
    canGetSelectEligibilityData,
    pinnedDashboardFeatures,
  ]);

  const activeFeature = useMemo(() => {
    const enabledFeaturesFlatten = NavigationFeatureManager.flattenFeatures(enabledFeatures);
    return enabledFeaturesFlatten.find(
      (feature) =>
        NavigationFeatureManager.matchFeaturePath(feature, router.pathname, router.query) ||
        (feature.subPath && router.pathname.endsWith(feature.subPath)),
    );
  }, [enabledFeatures, router.pathname, router.query]);

  const [expandedItemsBySection, setExpandedItemsBySection] = useLocalStorage<
    Record<string, string[]>
  >('creator-hub:game-left-nav-expanded', {});

  const handleExpandedItemsChange = useCallback(
    (sectionKey: string) => (_event: React.SyntheticEvent | null, itemIds: string[]) => {
      setExpandedItemsBySection((prev) => ({ ...prev, [sectionKey]: itemIds }));
    },
    [setExpandedItemsBySection],
  );

  return (
    <>
      <Grid item container direction='column'>
        <GameStatus />
        <Divider className='margin-y-[16px]' />
      </Grid>
      {GameLeftNavigationSectionTitleKeys.map((titleKey) => {
        const sectionKey = titleKey ?? 'default';
        return (
          enabledFeatures.some((feature) => feature.sectionTitleKey === titleKey) && (
            <Grid key={`navigation-section-${sectionKey}`} item container direction='column'>
              <Features
                key={`feature-${sectionKey}`}
                features={enabledFeatures.filter((feature) => feature.sectionTitleKey === titleKey)}
                activeFeature={activeFeature}
                title={titleKey && translate(titleKey)}
                name='game'
                defaultExpanded={expandedItemsBySection[sectionKey]}
                onExpandedItemsChange={handleExpandedItemsChange(sectionKey)}
              />
            </Grid>
          )
        );
      })}
      {dialog}
    </>
  );
};

const GameLeftNavigationWithPinnedDashboards: FunctionComponent = () => {
  const { gameDetails } = useCurrentGame();

  return <GameLeftNavigationPinnedDashboards universeId={gameDetails?.id ?? 0} />;
};

type GameLeftNavigationPinnedDashboardsProps = {
  readonly universeId: number;
};

const GameLeftNavigationPinnedDashboards: FunctionComponent<
  GameLeftNavigationPinnedDashboardsProps
> = ({ universeId }) => {
  const { userCanViewAnalyticsForUniverse } = useAnalyticsExperiencePermissions(universeId);
  const { ready: isCustomDashboardsReady, value: isCustomDashboardsEnabled } = useFlag(
    isCustomDashboardsEnabledFlag,
  );
  const canLoadPinnedDashboards =
    isCustomDashboardsReady &&
    isCustomDashboardsEnabled &&
    userCanViewAnalyticsForUniverse &&
    universeId > 0;
  const { data: dashboardsList } = useDashboardsListQuery(universeId, {
    enabled: canLoadPinnedDashboards,
  });
  const pinnedDashboardFeatures = useMemo<Feature<CreationsFeatureSettings>[]>(() => {
    if (!canLoadPinnedDashboards) {
      return [];
    }

    return (
      dashboardsList?.items
        .filter((dashboard) => dashboard.isPinned)
        .map((dashboard) => ({
          key: `customDashboard-${dashboard.id}`,
          nameKey: dashboard.name,
          displayName: dashboard.name,
          path: '/dashboard/creations/experiences/[id]/analytics/dashboards/[dashboardId]',
          query: { dashboardId: dashboard.id },
        })) ?? []
    );
  }, [canLoadPinnedDashboards, dashboardsList?.items]);

  return <GameLeftNavigation pinnedDashboardFeatures={pinnedDashboardFeatures} />;
};

const GameLeftNavigationWithProvider: FunctionComponent = () => {
  return (
    <CreationsCustomSettingsProvider>
      <GameLeftNavigationWithPinnedDashboards />
    </CreationsCustomSettingsProvider>
  );
};

export default withTranslation(GameLeftNavigationWithProvider, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
  TranslationNamespace.Environments,
  TranslationNamespace.ServerManagement,
  TranslationNamespace.PlayerFeedback,
]);
