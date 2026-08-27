import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  PlacementRewardStatusEnum,
  type PlacementTypeDefaults,
} from '@rbx/client-developer-ads-stats-api/v1';
import type { TStepperStep } from '@rbx/foundation-ui';
import { Button, Divider, Stepper } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, CircularProgress, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import CreatePlacementProcessReceiptStep from '../components/CreatePlacementProcessReceiptStep';
import CreatePlacementSetupStep from '../components/CreatePlacementSetupStep';
import { PlayWithRewardTestModeInfoDialog } from '../components/PlayWithRewardConfirmationDialog';
import { EligibilityProvider, useEligibility } from '../contexts/EligibilityContext';
import {
  UniverseAdsSettingsProvider,
  useUniverseAdsSettings,
  type UniverseAdsSettingsState,
} from '../contexts/UniverseAdsSettingsContext';
import {
  PlacementType,
  SHOW_MANAGE_TOOLTIP_QUERY_PARAM,
  normalizePlacements,
  type Placement,
} from '../types/placementTypes';
import { PlacementRewardStatus, RewardAccessMode, type RewardItem } from '../types/rewardTypes';

const PLACEMENT_SETUP_STEP = 0;
const PROCESS_RECEIPT_STEP = 1;
const DEFAULT_IMPRESSIONS = '3';
const FREQUENCY_CAP_WINDOW_MINUTES = 1440;

const isValidFrequencyCap = (value: string) => {
  const frequencyCap = Number(value);
  return Number.isInteger(frequencyCap) && frequencyCap > 0;
};

interface CreatePlacementFormProps {
  initialSettings: UniverseAdsSettingsState;
  pwrPlacement?: Placement;
  placementDefaults?: PlacementTypeDefaults;
}

const CreatePlacementForm = ({
  initialSettings,
  pwrPlacement,
  placementDefaults,
}: CreatePlacementFormProps) => {
  const router = useRouter();
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const showSnackbarMessage = useSnackbarAlert();

  const isEditMode = pwrPlacement != null;
  const initialFrequencyCapLimit = pwrPlacement
    ? (pwrPlacement.frequencyCapSettings?.frequencyCapLimit ?? Number(DEFAULT_IMPRESSIONS))
    : (placementDefaults?.frequencyCapLimit ?? Number(DEFAULT_IMPRESSIONS));
  const initialExcludeLikelyPayers = pwrPlacement
    ? (pwrPlacement.excludeLikelyPayers ?? false)
    : (placementDefaults?.excludeLikelyPayers ?? initialSettings.isExcludeLikelyPayersEnabled);

  const originalRewards = useMemo<RewardItem[]>(
    () =>
      pwrPlacement
        ? pwrPlacement.rewards.map((r) => ({
            productId: r.productId,
            name: r.name,
            imageAssetId: r.imageAssetId,
            status: r.status,
          }))
        : [],
    [pwrPlacement],
  );

  const [activeStep, setActiveStep] = useState(PLACEMENT_SETUP_STEP);
  const [rewardItems, setRewardItems] = useState<RewardItem[]>(() => [...originalRewards]);
  const [impressions, setImpressions] = useState(() => String(initialFrequencyCapLimit));
  const [isExcludeLikelyPayers, setIsExcludeLikelyPayers] = useState(initialExcludeLikelyPayers);
  const [isCreating, setIsCreating] = useState(false);
  const [isTestModeInfoDialogOpen, setIsTestModeInfoDialogOpen] = useState(false);
  const productIds = useMemo(
    () => rewardItems.map((rewardItem) => rewardItem.productId),
    [rewardItems],
  );

  const handleRewardItemsChange = useCallback(
    (newItems: RewardItem[]) => {
      const resolved: RewardItem[] = newItems.map((item) => {
        if (item.status != null) {
          return item;
        }
        const original = originalRewards.find((r) => r.productId === item.productId);
        if (original) {
          return { ...item, status: original.status };
        }
        return { ...item, status: PlacementRewardStatusEnum.REWARD_STATUS_DRAFT };
      });

      // Enforce single test-mode invariant: only one item can be TEST at a time
      const testModeIndex = resolved.findIndex(
        (r) => r.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST,
      );

      // If there are multiple test-mode items (e.g. re-added original), keep only the first
      if (testModeIndex >= 0) {
        for (let i = testModeIndex + 1; i < resolved.length; i++) {
          if (resolved[i].status === PlacementRewardStatusEnum.REWARD_STATUS_TEST) {
            resolved[i] = { ...resolved[i], status: PlacementRewardStatusEnum.REWARD_STATUS_DRAFT };
          }
        }
      }

      // If no test-mode item exists, promote the first draft
      if (testModeIndex < 0) {
        const firstDraftIndex = resolved.findIndex(
          (r) => r.status === PlacementRewardStatusEnum.REWARD_STATUS_DRAFT,
        );
        if (firstDraftIndex >= 0) {
          resolved[firstDraftIndex] = {
            ...resolved[firstDraftIndex],
            status: PlacementRewardStatusEnum.REWARD_STATUS_TEST,
          };
        }
      }

      setRewardItems(resolved);
    },
    [originalRewards],
  );

  const steps: TStepperStep[] = useMemo(
    () => [
      {
        label: translate(
          translationKey('Label.PlacementSetup', TranslationNamespace.ImmersiveAdsAnalytics),
        ),
      },
      {
        label: translate(
          translationKey('Label.ProcessReceiptApi', TranslationNamespace.ImmersiveAdsAnalytics),
        ),
      },
    ],
    [translate],
  );

  const handleBack = useCallback(() => {
    if (activeStep > PLACEMENT_SETUP_STEP) {
      setActiveStep((prev) => prev - 1);
    }
  }, [activeStep]);

  const handleNext = useCallback(() => {
    if (activeStep < PROCESS_RECEIPT_STEP) {
      setActiveStep((prev) => prev + 1);
    }
  }, [activeStep]);

  const navigateToPlacementSettings = useCallback(() => {
    void router.replace(
      `${creatorHub.dashboard.getMonetizationImmersiveAdsUrl(
        universeId,
      )}?tab=PlacementSettings&${SHOW_MANAGE_TOOLTIP_QUERY_PARAM}=true`,
    );
  }, [router, universeId]);

  const handleCloseTestModeInfoDialog = useCallback(() => {
    setIsTestModeInfoDialogOpen(false);
    navigateToPlacementSettings();
  }, [navigateToPlacementSettings]);

  const handleCreate = useCallback(async () => {
    if (rewardItems.length === 0 || !isValidFrequencyCap(impressions)) {
      return;
    }

    setIsCreating(true);
    try {
      const designatedTestItem = rewardItems.find(
        (r) => r.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST,
      );
      const isCreatingTestModeReward =
        !isEditMode ||
        (designatedTestItem != null &&
          originalRewards.find((reward) => reward.productId === designatedTestItem.productId)
            ?.status !== PlacementRewardStatusEnum.REWARD_STATUS_TEST);

      if (isEditMode) {
        const frequencyCapLimit = Number(impressions);
        const hasPlacementSettingsChanged =
          frequencyCapLimit !== initialFrequencyCapLimit ||
          isExcludeLikelyPayers !== initialExcludeLikelyPayers;

        if (hasPlacementSettingsChanged) {
          await developerAdsStatsClient.updatePlacement({
            adPlacementId: pwrPlacement.id,
            updatePlacementRequest: {
              excludeLikelyPayers: isExcludeLikelyPayers,
              isFrequencyCapEnabled: true,
              frequencyCapSettings: {
                frequencyCapLimit,
                frequencyCapWindowMinutes: FREQUENCY_CAP_WINDOW_MINUTES,
              },
            },
          });
        }

        const currentProductIds = rewardItems.map((r) => r.productId);
        const originalProductIds = originalRewards.map((r) => r.productId);
        const haveRewardItemsChanged =
          currentProductIds.length !== originalProductIds.length ||
          currentProductIds.some((id) => !originalProductIds.includes(id));
        if (haveRewardItemsChanged) {
          await developerAdsStatsClient.setPlacementRewards({
            adPlacementId: pwrPlacement.id,
            setPlacementRewardsRequest: {
              universeId,
              productIds: currentProductIds,
            },
          });
        }

        // Find the item we designated as test mode in the UI
        if (designatedTestItem) {
          // Only promote if it wasn't already TEST on the server
          const originalStatus = originalRewards.find(
            (o) => o.productId === designatedTestItem.productId,
          )?.status;
          if (originalStatus !== PlacementRewardStatusEnum.REWARD_STATUS_TEST) {
            await developerAdsStatsClient.updatePlacementReward({
              adPlacementId: pwrPlacement.id,
              productId: designatedTestItem.productId,
              updatePlacementRewardRequest: {
                universeId,
                status: PlacementRewardStatus.PLACEMENT_REWARD_STATUS_ACTIVE,
                accessMode: RewardAccessMode.PLACEMENT_REWARD_ACCESS_MODE_TEST,
              },
            });
          }
        }

        // If the original test item is still in the list but no longer designated as test, demote it
        const originalTestItem = originalRewards.find(
          (o) => o.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST,
        );
        if (
          originalTestItem &&
          rewardItems.some((r) => r.productId === originalTestItem.productId) &&
          designatedTestItem?.productId !== originalTestItem.productId
        ) {
          await developerAdsStatsClient.updatePlacementReward({
            adPlacementId: pwrPlacement.id,
            productId: originalTestItem.productId,
            updatePlacementRewardRequest: {
              universeId,
              // Leave the TEST access mode intact so the displaced reward returns to draft rather
              // than published; re-enabling it then goes through the test -> publish flow again.
              status: PlacementRewardStatus.PLACEMENT_REWARD_STATUS_INACTIVE,
            },
          });
        }
      } else {
        const createResponse = await developerAdsStatsClient.createPlacement({
          createPlacementRequest: {
            universeId,
            placementType: PlacementType.PlayWithReward,
            excludeLikelyPayers: isExcludeLikelyPayers,
            isFrequencyCapEnabled: placementDefaults?.enableFrequencyCapping,
            ...(placementDefaults?.enableFrequencyCapping && {
              frequencyCapSettings: {
                frequencyCapLimit: Number(impressions),
                frequencyCapWindowMinutes: FREQUENCY_CAP_WINDOW_MINUTES,
              },
            }),
          },
        });

        const newPlacementId = createResponse.placementId;
        if (!newPlacementId) {
          throw new Error('CreatePlacement did not return a placement ID');
        }

        await developerAdsStatsClient.setPlacementRewards({
          adPlacementId: newPlacementId,
          setPlacementRewardsRequest: {
            universeId,
            productIds: rewardItems.map((r) => r.productId),
          },
        });

        const testItem =
          rewardItems.find((r) => r.status === PlacementRewardStatusEnum.REWARD_STATUS_TEST) ??
          rewardItems[0];
        await developerAdsStatsClient.updatePlacementReward({
          adPlacementId: newPlacementId,
          productId: testItem.productId,
          updatePlacementRewardRequest: {
            universeId,
            status: PlacementRewardStatus.PLACEMENT_REWARD_STATUS_ACTIVE,
            accessMode: RewardAccessMode.PLACEMENT_REWARD_ACCESS_MODE_TEST,
          },
        });
      }

      if (isCreatingTestModeReward) {
        setIsTestModeInfoDialogOpen(true);
      } else {
        navigateToPlacementSettings();
      }
    } catch {
      showSnackbarMessage(
        'error',
        translate(
          translationKey(
            'Description.SettingsUpdateError',
            TranslationNamespace.ImmersiveAdsAnalytics,
          ),
        ),
      );
    } finally {
      setIsCreating(false);
    }
  }, [
    impressions,
    initialExcludeLikelyPayers,
    initialFrequencyCapLimit,
    isEditMode,
    isExcludeLikelyPayers,
    navigateToPlacementSettings,
    originalRewards,
    placementDefaults,
    pwrPlacement,
    rewardItems,
    showSnackbarMessage,
    translate,
    universeId,
  ]);

  return (
    <div className='flex flex-col gap-large'>
      {/* Page title */}
      <div className='flex flex-col gap-small'>
        <h1 className='text-heading-large margin-none'>
          {translate(
            translationKey(
              'Title.PlayWithRewardCreationPage',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
          )}
        </h1>
        <Typography variant='body1' color='secondary'>
          {translate(
            translationKey('Subtitle.CreatePlacement', TranslationNamespace.ImmersiveAdsAnalytics),
          )}
        </Typography>
      </div>

      {/* 2-step Stepper */}
      <div className='flex flex-col gap-large padding-y-medium width-full max-width-[723px]'>
        <Stepper
          steps={steps}
          size='Medium'
          borderPosition='Bottom'
          currentStepIndex={activeStep}
        />

        {/* Step content */}
        {activeStep === PLACEMENT_SETUP_STEP && (
          <CreatePlacementSetupStep
            impressions={impressions}
            onImpressionsChange={setImpressions}
            isExcludeLikelyPayers={isExcludeLikelyPayers}
            onExcludeLikelyPayersChange={setIsExcludeLikelyPayers}
            rewardItems={rewardItems}
            onRewardItemsChange={handleRewardItemsChange}
            maxRewardItems={placementDefaults?.maxProductIds}
            existingProductIds={productIds}
          />
        )}
        {activeStep === PROCESS_RECEIPT_STEP && (
          <CreatePlacementProcessReceiptStep productIds={productIds} />
        )}

        {/* Footer */}
        <Divider variant='Standard' />
        <div className='flex justify-between items-center'>
          <Button
            variant='Standard'
            size='Medium'
            onClick={handleBack}
            isDisabled={activeStep === PLACEMENT_SETUP_STEP}>
            {translate(translationKey('Label.Back', TranslationNamespace.ImmersiveAdsAnalytics))}
          </Button>
          <div className='flex items-center gap-small'>
            <Button
              variant='Emphasis'
              size='Medium'
              onClick={activeStep === PLACEMENT_SETUP_STEP ? handleNext : handleCreate}
              isLoading={activeStep === PROCESS_RECEIPT_STEP && isCreating}
              isDisabled={
                activeStep === PLACEMENT_SETUP_STEP
                  ? rewardItems.length === 0 || !isValidFrequencyCap(impressions)
                  : isCreating
              }>
              {activeStep === PLACEMENT_SETUP_STEP
                ? translate(
                    translationKey('Label.Continue', TranslationNamespace.ImmersiveAdsAnalytics),
                  )
                : translate(
                    translationKey('Label.Create', TranslationNamespace.ImmersiveAdsAnalytics),
                  )}
            </Button>
            <Button
              variant='Standard'
              size='Medium'
              isDisabled={isCreating}
              onClick={() => {
                router.back();
              }}>
              {translate(
                translationKey('Label.Cancel', TranslationNamespace.ImmersiveAdsAnalytics),
              )}
            </Button>
          </div>
        </div>
      </div>
      {isTestModeInfoDialogOpen && (
        <PlayWithRewardTestModeInfoDialog onClose={handleCloseTestModeInfoDialog} />
      )}
    </div>
  );
};

const CreatePlacementContent = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { state: universeAdsSettings } = useUniverseAdsSettings();
  const { id: universeId } = useUniverseResource();
  const [pwrPlacement, setPwrPlacement] = useState<Placement | undefined>(undefined);
  const [placementDefaults, setPlacementDefaults] = useState<PlacementTypeDefaults | undefined>(
    undefined,
  );
  const [isLoadingPlacements, setIsLoadingPlacements] = useState(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (universeId <= 0) {
      return undefined;
    }
    let cancelled = false;
    const fetchPlacements = async () => {
      try {
        const apiPlacements = await developerAdsStatsClient.getPlacements({ universeId });
        if (cancelled) {
          return;
        }
        const placements = normalizePlacements(apiPlacements);
        setPwrPlacement(placements.find((p) => p.type === PlacementType.PlayWithReward));
      } catch {
        // Surface the failure instead of silently falling back to create mode and losing settings.
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPlacements(false);
        }
      }
    };
    void fetchPlacements();
    return () => {
      cancelled = true;
    };
  }, [universeId]);

  useEffect(() => {
    let cancelled = false;
    const fetchMetadata = async () => {
      try {
        const response = await developerAdsStatsClient.getImmersiveAdsMetadata();
        if (cancelled) {
          return;
        }
        const defaults = response.placementTypeDefaults?.[String(PlacementType.PlayWithReward)];
        setPlacementDefaults(defaults);
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMetadata(false);
        }
      }
    };
    void fetchMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  if (universeAdsSettings.isLoading || isLoadingPlacements || isLoadingMetadata) {
    return <CircularProgress />;
  }

  if (hasError) {
    return (
      <Alert severity='error'>
        <Typography>
          {translate(
            translationKey(
              'Description.PlacementLoadError',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
          )}
        </Typography>
      </Alert>
    );
  }

  return (
    <CreatePlacementForm
      initialSettings={universeAdsSettings}
      pwrPlacement={pwrPlacement}
      placementDefaults={placementDefaults}
    />
  );
};

const CreatePlacementGuard = () => {
  const { eligibilityState } = useEligibility();
  const { isFetched, showPwRSettings } = eligibilityState;

  if (!isFetched) {
    return <CircularProgress />;
  }

  if (!showPwRSettings) {
    return <PageNotFound />;
  }

  return <CreatePlacementContent />;
};

const CreatePlacementPageContent = () => {
  const { id: universeId } = useUniverseResource();

  return (
    <EligibilityProvider universeId={universeId}>
      <UniverseAdsSettingsProvider universeId={universeId}>
        <CreatePlacementGuard />
      </UniverseAdsSettingsProvider>
    </EligibilityProvider>
  );
};

export default withTranslation(CreatePlacementPageContent, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
