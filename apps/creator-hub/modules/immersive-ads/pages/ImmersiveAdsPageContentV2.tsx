import { useMemo, useCallback, useEffect, useReducer } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Link,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  Chip,
  useTheme,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsImmersiveAdsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { GetEstimatedAdsEarningsResponse } from '@modules/clients/developerAdsStats';
import developerAdsStatsClient, { ModerationStatus } from '@modules/clients/developerAdsStats';
import { getErrorStatus } from '@modules/clients/utils/errorHelpers';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { ExperienceAnalyticsTabbedPageLayout } from '@modules/experience-analytics-shared/layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import {
  ROBLOX_TERMS_OF_USE,
  ROBLOX_COMMUNITY_STANDARDS,
  ROBLOX_ADVERTISING_STANDARDS,
} from '@modules/miscellaneous/common/constants/linkConstants';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import AdsSettingsTabContent from '../ads-settings/AdsSettingsTabContent';
import AdsAnalyticsPage from '../analytics/AdsAnalyticsPage';
import EstimateEarningCalculator from '../components/EstimateEarningCalculator';
import PlayWithRewardBanner from '../components/PlayWithRewardBanner';
import { EligibilityProvider, useEligibility } from '../contexts/EligibilityContext';
import {
  UniverseAdsSettingsProvider,
  useUniverseAdsSettings,
} from '../contexts/UniverseAdsSettingsContext';
import { normalizePlacements, type Placement } from '../types/placementTypes';
import ImmersiveAdsEligibilityContent from './ImmersiveAdsEligibilityContent';
import useImmersiveAdsPageStyles, {
  getEligibilityAccordionStyles,
} from './ImmersiveAdsPage.styles';
import ImmersiveAdsPlacementTabContent from './ImmersiveAdsPlacementTabContent';

enum ImmersiveAdsPageTabKey {
  Eligibility = 'Eligibility',
  Analytics = 'Analytics',
  PlacementSettings = 'PlacementSettings',
  Settings = 'Settings',
}

enum PlacementActionType {
  FETCH_INIT = 'FETCH_PLACEMENTS_INIT',
  FETCH_SUCCESS = 'FETCH_PLACEMENTS_SUCCESS',
  FETCH_FAILURE = 'FETCH_PLACEMENTS_FAILURE',
}

interface PlacementsState {
  placements: Placement[];
  isLoading: boolean;
  isError: boolean;
  errorStatus: number;
}

interface PlacementsAction {
  type: PlacementActionType;
  payload?: { placements: Placement[] } | Placement[];
  errorCode?: number;
}

const initialPlacementsState: PlacementsState = {
  placements: [],
  isLoading: false,
  isError: false,
  errorStatus: 0,
};

function placementsReducer(state: PlacementsState, action: PlacementsAction): PlacementsState {
  switch (action.type) {
    case PlacementActionType.FETCH_INIT:
      return { ...state, isLoading: true, isError: false, errorStatus: 0 };
    case PlacementActionType.FETCH_SUCCESS: {
      const newPlacements = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.placements;

      if (newPlacements) {
        // Sort by default placement first, then by createdTimestampMs
        newPlacements.sort((a, b) => {
          if (a.defaultPlacement) {
            return -1;
          }
          if (b.defaultPlacement) {
            return 1;
          }
          // If neither is default, sort by timestamp
          return a.createdTimestampMs - b.createdTimestampMs;
        });
      }

      return { ...state, placements: newPlacements ?? [], isLoading: false };
    }
    case PlacementActionType.FETCH_FAILURE:
      return {
        ...state,
        placements: [],
        isLoading: false,
        isError: true,
        errorStatus: action.errorCode ?? 500,
      };
    default:
      return state;
  }
}

enum CalculatorDataActionType {
  FETCH_INIT = 'FETCH_CALCULATOR_DATA_INIT',
  FETCH_SUCCESS = 'FETCH_CALCULATOR_DATA_SUCCESS',
  FETCH_FAILURE = 'FETCH_CALCULATOR_DATA_FAILURE',
}

interface CalculatorDataState {
  data: GetEstimatedAdsEarningsResponse | null;
  isLoading: boolean;
  isError: boolean;
  errorStatus: number;
}

type CalculatorDataAction =
  | { type: CalculatorDataActionType.FETCH_INIT }
  | { type: CalculatorDataActionType.FETCH_SUCCESS; payload: GetEstimatedAdsEarningsResponse }
  | { type: CalculatorDataActionType.FETCH_FAILURE; errorCode?: number };

const initialCalculatorDataState: CalculatorDataState = {
  data: null,
  isLoading: false,
  isError: false,
  errorStatus: 0,
};

function calculatorDataReducer(
  state: CalculatorDataState,
  action: CalculatorDataAction,
): CalculatorDataState {
  switch (action.type) {
    case CalculatorDataActionType.FETCH_INIT:
      return { ...state, isLoading: true, isError: false, errorStatus: 0 };
    case CalculatorDataActionType.FETCH_SUCCESS:
      return { ...state, data: action.payload, isLoading: false };
    case CalculatorDataActionType.FETCH_FAILURE:
      return {
        ...state,
        data: null,
        isLoading: false,
        isError: true,
        errorStatus: action.errorCode ?? 500,
      };
    default:
      return state;
  }
}

const { docs, dashboard } = creatorHub;

const ImmersiveAdsLink = (chunks: React.ReactNode) => {
  return (
    <Link href={docs.getImmersiveAdsMonetizationUrl()} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

const RobloxTermsOfUseLink = (chunks: React.ReactNode) => {
  return (
    <Link href={ROBLOX_TERMS_OF_USE} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

const RobloxCommunityStandardsLink = (chunks: React.ReactNode) => {
  return (
    <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

const RobloxAdvertisingStandardsLink = (chunks: React.ReactNode) => {
  return (
    <Link href={ROBLOX_ADVERTISING_STANDARDS} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

const RobloxAppealsPortalLink = (chunks: React.ReactNode) => {
  return (
    <Link href={www.getAppealsPortalUrl()} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

const ImmersiveAdsPageContent = () => {
  const theme = useTheme();
  const intl = useTranslation();
  const { translate, translateHTML } = useTranslationWrapper(intl);
  const { canConfigure, isLoadingGame } = useCurrentGame();
  const { id: universeId } = useUniverseResource();
  const { isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);

  const {
    classes: {
      descriptionStyle,
      rewardedAdsSuspendedAlert,
      eligibilityTabContainer,
      eligibilityAccordionContent,
      eligibilityHeaderContainer,
      eligibilityTitleContainer,
      eligibilityChipBase,
      eligibilityChipEligible,
      eligibilityChipIneligible,
      eligibilityChipPending,
    },
    cx,
  } = useImmersiveAdsPageStyles();
  const { eligibilityState } = useEligibility();
  const { isUniverseEligible } = eligibilityState;

  const [placementsState, dispatchPlacements] = useReducer(
    placementsReducer,
    initialPlacementsState,
  );

  const [calculatorDataState, dispatchCalculatorData] = useReducer(
    calculatorDataReducer,
    initialCalculatorDataState,
  );

  const { state: universeAdsSettingsState, fetchUniverseAdsSettings } = useUniverseAdsSettings();

  const fetchPlacementsList = useCallback(async () => {
    if (universeId === uninitializedUniverseId) {
      return;
    }
    dispatchPlacements({ type: PlacementActionType.FETCH_INIT });
    try {
      const response = await developerAdsStatsClient.getPlacements({
        universeId,
      });
      dispatchPlacements({
        type: PlacementActionType.FETCH_SUCCESS,
        payload: { placements: normalizePlacements(response) },
      });
    } catch (error) {
      const errorCode = getErrorStatus(error, 500);
      dispatchPlacements({
        type: PlacementActionType.FETCH_FAILURE,
        errorCode,
      });
    }
  }, [universeId]);

  const fetchCalculatorData = useCallback(async () => {
    if (universeId === uninitializedUniverseId || universeId <= 0) {
      return;
    }

    try {
      dispatchCalculatorData({ type: CalculatorDataActionType.FETCH_INIT });

      const response = await developerAdsStatsClient.getEstimatedAdsEarnings({
        universeId,
      });

      dispatchCalculatorData({
        type: CalculatorDataActionType.FETCH_SUCCESS,
        payload: response,
      });
    } catch (error) {
      const errorCode = getErrorStatus(error, 500);
      dispatchCalculatorData({
        type: CalculatorDataActionType.FETCH_FAILURE,
        errorCode,
      });
    }
  }, [universeId]);

  useEffect(() => {
    if (universeId && universeId > 0) {
      void fetchPlacementsList();
      void fetchCalculatorData();
    }
  }, [universeId, fetchPlacementsList, fetchCalculatorData]);

  const rewardedAdsSuspendedAlertContent = useMemo(() => {
    if (!eligibilityState.isUniverseSuspendedFromRewardedAds) {
      return null;
    }

    return (
      <div className={rewardedAdsSuspendedAlert}>
        <Alert severity='warning'>
          {translateHTML(
            translationKey(
              'Description.RewardedAdsSuspended',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: RobloxAppealsPortalLink,
              },
            ],
          )}
        </Alert>
      </div>
    );
  }, [
    rewardedAdsSuspendedAlert,
    eligibilityState.isUniverseSuspendedFromRewardedAds,
    translateHTML,
  ]);

  const pageDescription = useMemo(() => {
    const description = (
      <div className={descriptionStyle}>
        <Typography>
          {translateHTML(
            translationKey(
              'Description.ImmersiveAdsOverviewAndCompliance',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
            [
              {
                opening: 'adsLinkStart',
                closing: 'adsLinkEnd',
                content: ImmersiveAdsLink,
              },
              {
                opening: 'tosLinkStart',
                closing: 'tosLinkEnd',
                content: RobloxTermsOfUseLink,
              },
              {
                opening: 'commLinkStart',
                closing: 'commLinkEnd',
                content: RobloxCommunityStandardsLink,
              },
              {
                opening: 'adStandLinkStart',
                closing: 'adStandLinkEnd',
                content: RobloxAdvertisingStandardsLink,
              },
            ],
          )}
        </Typography>
      </div>
    );

    return (
      <div className='flex flex-col grow-1 min-width-0 padding-left-large'>
        {description}
        {rewardedAdsSuspendedAlertContent}
        {rewardedAdsSuspendedAlertContent
          ? null
          : eligibilityState.isFetched &&
            eligibilityState.isUniverseEligible &&
            eligibilityState.showPwRSettings && (
              <PlayWithRewardBanner
                createPlacementUrl={dashboard.getMonetizationImmersiveAdsCreatePlacementUrl(
                  universeId,
                )}
              />
            )}
      </div>
    );
  }, [
    descriptionStyle,
    translateHTML,
    rewardedAdsSuspendedAlertContent,
    eligibilityState.showPwRSettings,
    eligibilityState.isFetched,
    eligibilityState.isUniverseEligible,
    universeId,
  ]);

  const renderEligibilityContent = useCallback(() => {
    const eligibilityContent = <ImmersiveAdsEligibilityContent />;

    // Determine eligibility label and chip style.
    // Label.CMQRejected only when questionnaire Rejected is the sole blocker (all other criteria pass).
    let eligibilityLabelKey = 'Label.Ineligible';
    let eligibilityChipStyle = eligibilityChipIneligible;

    const experienceGuidelinesStatus = eligibilityState.experienceGuidelinesModerationStatus;
    const isExperienceGuidelinesApproved = experienceGuidelinesStatus === ModerationStatus.Approved;
    const isExperienceGuidelinesRejected =
      experienceGuidelinesStatus === ModerationStatus.Rejected ||
      experienceGuidelinesStatus === ModerationStatus.ProhibitedContent;

    if (isUniverseEligible) {
      if (isExperienceGuidelinesRejected) {
        eligibilityLabelKey = 'Label.CMQRejected';
        eligibilityChipStyle = eligibilityChipIneligible;
      } else if (isExperienceGuidelinesApproved) {
        eligibilityLabelKey = 'Label.Eligible';
        eligibilityChipStyle = eligibilityChipEligible;
      } else {
        eligibilityLabelKey = 'Label.PendingGuidelinesModeration';
        eligibilityChipStyle = eligibilityChipPending;
      }
    }

    return (
      <div className={eligibilityTabContainer}>
        {!calculatorDataState.isError && calculatorDataState.data && (
          <EstimateEarningCalculator apiData={calculatorDataState.data} />
        )}
        <Accordion defaultExpanded={!isUniverseEligible} sx={getEligibilityAccordionStyles(theme)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls='eligibility-content'
            id='eligibility-header'>
            <div className={eligibilityHeaderContainer}>
              <div className={eligibilityTitleContainer}>
                <Typography variant='h5'>
                  {translate(
                    translationKey(
                      'Title.EligibilityRequirements',
                      TranslationNamespace.ImmersiveAdsAnalytics,
                    ),
                  )}
                </Typography>
                <Chip
                  label={translate(
                    translationKey(eligibilityLabelKey, TranslationNamespace.ImmersiveAdsAnalytics),
                  )}
                  size='small'
                  className={cx(eligibilityChipBase, eligibilityChipStyle)}
                />
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div
              className={eligibilityAccordionContent}
              style={{ width: '100%', maxWidth: '100%' }}>
              {eligibilityContent}
            </div>
          </AccordionDetails>
        </Accordion>
      </div>
    );
  }, [
    calculatorDataState,
    eligibilityTabContainer,
    eligibilityHeaderContainer,
    eligibilityTitleContainer,
    isUniverseEligible,
    eligibilityState.experienceGuidelinesModerationStatus,
    cx,
    eligibilityChipBase,
    eligibilityChipEligible,
    eligibilityChipIneligible,
    eligibilityChipPending,
    translate,
    eligibilityAccordionContent,
    theme,
  ]);

  const eligibilityTab = useMemo(
    () => ({
      key: ImmersiveAdsPageTabKey.Eligibility,
      label: translate(
        translationKey('Heading.Eligibility', TranslationNamespace.ImmersiveAdsAnalytics),
      ),
      content: renderEligibilityContent(),
    }),
    [translate, renderEligibilityContent],
  );

  const placementTab = useMemo(
    () => ({
      key: ImmersiveAdsPageTabKey.PlacementSettings,
      label: translate(
        translationKey('Heading.Placement', TranslationNamespace.ImmersiveAdsAnalytics),
      ),
      content: (
        <ImmersiveAdsPlacementTabContent
          universeId={universeId}
          placements={placementsState.placements}
          isLoading={placementsState.isLoading}
          error={placementsState.isError ? new Error('Failed to load placements') : null}
          onRefreshPlacements={fetchPlacementsList}
          createPlacementUrl={dashboard.getMonetizationImmersiveAdsCreatePlacementUrl(universeId)}
          showPlayWithRewardSettings={eligibilityState.showPwRSettings}
          rewardMetadata={universeAdsSettingsState.rewardMetadata}
          playWithRewardServingStatus={universeAdsSettingsState.pwrServingStatus}
          onRefreshPlayWithRewardServingStatus={fetchUniverseAdsSettings}
        />
      ),
    }),
    [
      translate,
      placementsState,
      fetchPlacementsList,
      universeId,
      eligibilityState.showPwRSettings,
      universeAdsSettingsState.rewardMetadata,
      universeAdsSettingsState.pwrServingStatus,
      fetchUniverseAdsSettings,
    ],
  );

  const settingsTab = useMemo(
    () => ({
      key: ImmersiveAdsPageTabKey.Settings,
      label: translate(
        translationKey('Heading.Settings', TranslationNamespace.ImmersiveAdsAnalytics),
      ),
      content: <AdsSettingsTabContent />,
    }),
    [translate],
  );

  const analyticsTab = useMemo(
    () => ({
      key: ImmersiveAdsPageTabKey.Analytics,
      label: translate(
        translationKey('Heading.Analytics', TranslationNamespace.ImmersiveAdsAnalytics),
      ),
      content: <AdsAnalyticsPage />,
    }),
    [translate],
  );

  const orderedTabs = useMemo(() => {
    const tabs = [];
    const shouldShowPlacementTab =
      eligibilityState.isUniverseEligible || universeAdsSettingsState.isRewardedAdsEnabled;

    // Analytics tab can be shown to all users. The analytics components render permission errors inline.
    tabs.push(analyticsTab);
    tabs.push(settingsTab);
    if (shouldShowPlacementTab) {
      tabs.push(placementTab);
    }
    // Eligibility tab with calculator is always at the end
    tabs.push(eligibilityTab);
    return tabs;
  }, [
    analyticsTab,
    eligibilityState.isUniverseEligible,
    universeAdsSettingsState.isRewardedAdsEnabled,
    eligibilityTab,
    settingsTab,
    placementTab,
  ]);

  const isPageLoading =
    isPendingAnalyticsExperiencePermissions || isLoadingGame || canConfigure === null;

  if (isPageLoading) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    // oxlint-disable-next-line typescript/no-deprecated -- will migrate to new layout
    <ExperienceAnalyticsTabbedPageLayout
      description={pageDescription}
      controls={[]}
      tabs={orderedTabs}
      navigationItem={analyticsImmersiveAdsNavigationItem}
    />
  );
};

// We wrap the immersive ads page content with the providers
// to allow the ending date range to end on today UTC midnight
const ImmersiveAdsPage = () => {
  const { id: universeId } = useUniverseResource();

  return (
    <EligibilityProvider universeId={universeId}>
      <UniverseAdsSettingsProvider universeId={universeId}>
        <ImmersiveAdsPageContent />
      </UniverseAdsSettingsProvider>
    </EligibilityProvider>
  );
};

const ImmersiveAdsPageContainer = () => {
  return <ImmersiveAdsPage />;
};

export default withTranslation(ImmersiveAdsPageContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
