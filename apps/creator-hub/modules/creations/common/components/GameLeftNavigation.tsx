import React, { FunctionComponent, useMemo, useCallback, Fragment } from 'react';
import { useRouter } from 'next/router';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
// eslint-disable-next-line no-restricted-imports -- Importing file specifically to break circular imports
import type Feature from '@modules/navigation/feature/interfaces/Feature';
// eslint-disable-next-line no-restricted-imports -- Importing file specifically to break circular imports
import Features from '@modules/navigation/leftNavigation/components/Features';
// eslint-disable-next-line no-restricted-imports -- Importing file specifically to break circular imports
import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import { useSettings } from '@modules/settings';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Divider, Grid } from '@rbx/ui';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { useAuthentication } from '@modules/authentication/providers';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useIXPParameters, useStudioEditPlaceLauncher } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useQuery } from '@tanstack/react-query';
import coreContentClient from '@modules/clients/coreContent';
import useSocialLinksBehavior from '@modules/social-links/hooks/useSocialLinksBehavior';
import { useUniversePermissions } from '@modules/react-query/organizations';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import AnalyticsFlags from '@modules/feature-flags/analytics/flags';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { useLocalStorage } from '@rbx/react-utilities';
import { useCreationsCustomSettings } from '..';
import { GameStatus } from '../../game';
import {
  creationsFeatureManager,
  CreationsFeatureSettings,
  GameLeftNavigationSectionTitleKeys,
} from '../creationsFeatureManager';
import { CreationsCustomSettingsProvider } from '../implementations/creationsCustomSettings';

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

const GameLeftNavigation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
  const { isFetched: isAnalyticsFlagsFetched, ...analyticsFlags } = useFeatureFlagsForNamespace(
    AnalyticsFlags,
    FeatureFlagNamespace.Analytics,
  );
  const { launch } = useStudioEditPlaceLauncher();
  const {
    params: { enableImpactedExperiencesView },
  } = useIXPParameters(IXPLayers.CreatorDashboard);
  const { data: eligibilityData } = useQuery({
    queryKey: ['coreContentBatchGetUniversePublishEligibility', gameDetails?.id ?? 0],
    queryFn: () =>
      coreContentClient.coreContentBatchGetUniversePublishEligibility({
        coreContentBatchGetUniversePublishEligibilityRequest: {
          universeIds: [gameDetails!.id ?? 0],
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
    const mergedSettings =
      isFetched === false && canConfigure !== null
        ? undefined
        : {
            ...settings,
            ...creationsCustomSettings,
            ...analyticsFlags,
            isStudioCompatible: isCompatible,
            canConfigure: canConfigure as boolean,
            permissions: permissions ?? null,
            canConfigureExperienceEvents: (isExperienceCreatedByCurrentUser ||
              orgPermissions?.canManageExperienceEvents) as boolean,
            canManageWebhooks:
              isExperienceCreatedByCurrentUser ||
              (permissions as Record<string, boolean> | undefined)?.manageWebhooks === true,
            locale,
            isExperienceCreatedByCurrentUserOrGroup:
              isExperienceCreatedByCurrentUser || isExperienceCreatedByCurrentGroup,
            shouldUseQuestionnaireV2,
            shouldHideSocialLinksSection,
            enableImpactedExperiencesView: enableImpactedExperiencesView ?? false,
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
                universeId: gameDetails?.id?.toString() || '',
                placeId: gameDetails?.rootPlaceId?.toString() || '',
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

    return filterFeatures.map((currentFeature) => {
      let feature = currentFeature;
      if (currentFeature.subFeatures != null) {
        feature = {
          ...currentFeature,
          subFeatures: currentFeature.subFeatures.map(mapFeature),
        };
      }
      return mapFeature(feature);
    }, [] as Feature<CreationsFeatureSettings>[]);
  }, [
    gameDetails?.creator?.type,
    gameDetails?.creator?.id,
    gameDetails?.id,
    gameDetails?.rootPlaceId,
    user?.id,
    currentGroup?.id,
    isFetched,
    canConfigure,
    settings,
    creationsCustomSettings,
    analyticsFlags,
    isCompatible,
    permissions,
    orgPermissions?.canManageExperienceEvents,
    locale,
    shouldUseQuestionnaireV2,
    allFeatures,
    launch,
    open,
    shouldHideSocialLinksSection,
    enableImpactedExperiencesView,
    canGetSelectEligibilityData,
  ]);

  const allFeaturesFlatten = featureManager.getAllFeaturesFlatten();
  const activeFeature = useMemo(() => {
    return allFeaturesFlatten.find(
      (feature) =>
        NavigationFeatureManager.matchFeaturePath(feature, router.pathname, router.query) ||
        (feature.subPath && router.pathname.endsWith(feature.subPath)),
    );
  }, [allFeaturesFlatten, router.pathname, router.query]);

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
    <Fragment>
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
    </Fragment>
  );
};
const GameLeftNavigationWithProvider: FunctionComponent = () => {
  return (
    <CreationsCustomSettingsProvider>
      <GameLeftNavigation />
    </CreationsCustomSettingsProvider>
  );
};

export default withTranslation(GameLeftNavigationWithProvider, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
  TranslationNamespace.Environments,
  TranslationNamespace.ServerManagement,
]);
