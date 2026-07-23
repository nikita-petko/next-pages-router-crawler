import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { PlayWithRewardServingStatus } from '@rbx/client-developer-ads-stats-api/v1';
import type { TStepperStep } from '@rbx/foundation-ui';
import { Button, Divider, Stepper } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { CircularProgress, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CreatePlacementProcessReceiptStep from '../components/CreatePlacementProcessReceiptStep';
import CreatePlacementSetupStep from '../components/CreatePlacementSetupStep';
import { PLAY_WITH_REWARD_BANNER_STORAGE_KEY } from '../components/PlayWithRewardBanner';
import { PlayWithRewardTestModeInfoDialog } from '../components/PlayWithRewardConfirmationDialog';
import { EligibilityProvider, useEligibility } from '../contexts/EligibilityContext';
import {
  UniverseAdsSettingsProvider,
  useUniverseAdsSettings,
  type UniverseAdsSettingsState,
} from '../contexts/UniverseAdsSettingsContext';
import type { RewardItem } from '../types/rewardTypes';

const PLACEMENT_SETUP_STEP = 0;
const PROCESS_RECEIPT_STEP = 1;
const DEFAULT_IMPRESSIONS = '3';

const isValidFrequencyCap = (value: string) => {
  const frequencyCap = Number(value);
  return Number.isInteger(frequencyCap) && frequencyCap > 0;
};

interface CreatePlacementFormProps {
  initialSettings: UniverseAdsSettingsState;
}

const CreatePlacementForm = ({ initialSettings }: CreatePlacementFormProps) => {
  const router = useRouter();
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const showSnackbarMessage = useSnackbarAlert();
  const [, setShowPlayWithRewardBanner] = useLocalStorage(
    PLAY_WITH_REWARD_BANNER_STORAGE_KEY,
    true,
  );
  const initialRewardMetadata = initialSettings.rewardMetadata;
  const initialProductId = initialRewardMetadata?.rewardInfo?.productId;

  const [activeStep, setActiveStep] = useState(PLACEMENT_SETUP_STEP);
  const [rewardItems, setRewardItems] = useState<RewardItem[]>(() =>
    initialProductId
      ? [
          {
            productId: initialProductId,
            name: initialRewardMetadata?.displayDetails?.productName ?? '',
            imageAssetId: initialRewardMetadata?.displayDetails?.imageAssetId,
          },
        ]
      : [],
  );
  const [impressions, setImpressions] = useState(
    initialRewardMetadata?.rewardInfo?.rewardsFrequencyCapDaily
      ? String(initialRewardMetadata.rewardInfo.rewardsFrequencyCapDaily)
      : DEFAULT_IMPRESSIONS,
  );
  const [isExcludeLikelyPayers, setIsExcludeLikelyPayers] = useState(
    initialRewardMetadata?.rewardInfo?.excludeLikelyPayers ??
      initialSettings.isExcludeLikelyPayersEnabled,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isTestModeInfoDialogOpen, setIsTestModeInfoDialogOpen] = useState(false);
  const rewardStatus =
    initialProductId != null && rewardItems[0]?.productId === initialProductId
      ? initialSettings.pwrServingStatus
      : PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_PENDING;
  const hasExistingRewardChanged =
    initialProductId != null && rewardItems[0]?.productId !== initialProductId;
  const productIds = useMemo(
    () => rewardItems.map((rewardItem) => rewardItem.productId),
    [rewardItems],
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

  const handleCreate = useCallback(async () => {
    const productId = rewardItems[0]?.productId;
    if (!productId || !isValidFrequencyCap(impressions)) {
      return;
    }

    const rewardsFrequencyCapDaily = Number(impressions);
    setIsCreating(true);
    try {
      await developerAdsStatsClient.updateUniverseAdsSettings({
        universeId,
        updateUniverseAdsSettingsRequest: {
          isPlayWithRewardEnabled: true,
          isExcludeLikelyPayersEnabled: isExcludeLikelyPayers,
          rewardInfo: {
            productId,
            rewardsFrequencyCapDaily,
          },
        },
      });
      setShowPlayWithRewardBanner(false);
      if (hasExistingRewardChanged) {
        setIsTestModeInfoDialogOpen(true);
      } else {
        router.back();
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
    hasExistingRewardChanged,
    impressions,
    isExcludeLikelyPayers,
    rewardItems,
    router,
    setShowPlayWithRewardBanner,
    showSnackbarMessage,
    translate,
    universeId,
  ]);

  const handleCloseTestModeInfoDialog = useCallback(() => {
    setIsTestModeInfoDialogOpen(false);
    router.back();
  }, [router]);

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
            rewardStatus={rewardStatus}
            showRewardRestartWarning={hasExistingRewardChanged}
            onRewardItemsChange={setRewardItems}
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
  const { state: universeAdsSettings } = useUniverseAdsSettings();

  if (universeAdsSettings.isLoading) {
    return <CircularProgress />;
  }

  return <CreatePlacementForm initialSettings={universeAdsSettings} />;
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
