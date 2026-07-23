import { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Alert,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Link,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RewardedAdsIneligibleSettingsBannerKey } from '../constants/adsSettingsTranslationKeys';
import { useEligibility } from '../contexts/EligibilityContext';
import { useUniverseAdsSettings } from '../contexts/UniverseAdsSettingsContext';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import AdServingSettings from './AdServingSettings';
import AdTypeSettings from './AdTypeSettings';
import type { AdSettingsFormData } from './interfaces';
import type { SettingsStatusType } from './SettingsStatusMessage';
import TranslatedSettingsStatusMessage from './SettingsStatusMessage';

const AD_SERVING_NOT_ENABLED_STATUS_CODE = 400;

const AdsSettingsTabContent = () => {
  const router = useRouter();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const {
    eligibilityState: { isFetched: isEligibilityFetched, isUniverseEligible },
  } = useEligibility();
  const {
    classes: { settingsContainer },
  } = useImmersiveAdsPageStyles();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [status, setStatus] = useState<SettingsStatusType>(null);
  const {
    state: {
      isRewardedAdsEnabled,
      isAppPromoEnabled,
      isClickOutEnabled,
      isExcludeLikelyPayersEnabled,
      isError,
      errorStatus,
    },
    updateUniverseAdsSettings,
  } = useUniverseAdsSettings();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<AdSettingsFormData>({
    defaultValues: {
      isRewardedAdsEnabled,
      isAppPromoEnabled,
      isClickOutEnabled,
      isExcludeLikelyPayersEnabled,
    },
  });

  const servingEnabled = useWatch({ control, name: 'isRewardedAdsEnabled' });

  useEffect(() => {
    if (!status) {
      return;
    }
    setTimeout(() => {
      setStatus(null);
    }, 4000);
  }, [status]);

  const hasChanges = isDirty;
  const hasSettingsFetchError = isError && errorStatus !== AD_SERVING_NOT_ENABLED_STATUS_CODE;
  const areSettingsDisabled = !isEligibilityFetched || !isUniverseEligible || hasSettingsFetchError;

  const eligibilityTabHref = useMemo(() => {
    const url = new URL(router.asPath, 'https://create.roblox.com');
    url.searchParams.set('tab', 'Eligibility');
    return `${url.pathname}${url.search}${url.hash}`;
  }, [router.asPath]);

  const handleEligibilityTabClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      void router.push(eligibilityTabHref, undefined, { shallow: true, scroll: false });
    },
    [eligibilityTabHref, router],
  );

  const EligibilityTabLink = useCallback(
    (chunks: React.ReactNode) => {
      return (
        <Link href={eligibilityTabHref} underline='always' onClick={handleEligibilityTabClick}>
          {chunks}
        </Link>
      );
    },
    [eligibilityTabHref, handleEligibilityTabClick],
  );

  // Update form values when context state changes
  useEffect(() => {
    reset({
      isRewardedAdsEnabled,
      isAppPromoEnabled,
      isClickOutEnabled,
      isExcludeLikelyPayersEnabled,
    });
  }, [
    isRewardedAdsEnabled,
    isAppPromoEnabled,
    isClickOutEnabled,
    isExcludeLikelyPayersEnabled,
    reset,
  ]);

  // Update status based on form state
  useEffect(() => {
    if (hasChanges && status !== 'error' && status !== 'success') {
      setStatus('unsaved');
    } else if (!hasChanges && status === 'unsaved') {
      setStatus(null);
    }
  }, [hasChanges, status]);

  const handleCancel = useCallback(() => {
    reset({
      isRewardedAdsEnabled,
      isAppPromoEnabled,
      isClickOutEnabled,
      isExcludeLikelyPayersEnabled,
    });
    setStatus(null);
  }, [
    isRewardedAdsEnabled,
    isAppPromoEnabled,
    isClickOutEnabled,
    isExcludeLikelyPayersEnabled,
    reset,
  ]);

  const handleConfirmSave = useCallback(
    async (data: AdSettingsFormData) => {
      setIsConfirmModalOpen(false);
      setStatus(null); // Clear any existing status

      try {
        await updateUniverseAdsSettings(
          data.isRewardedAdsEnabled,
          data.isAppPromoEnabled,
          data.isClickOutEnabled,
          data.isExcludeLikelyPayersEnabled,
        );
        setStatus('success');
      } catch {
        setStatus('error');
      }
    },
    [updateUniverseAdsSettings],
  );

  const onSubmit = useCallback(
    (data: AdSettingsFormData) => {
      if (
        (isRewardedAdsEnabled && !data.isRewardedAdsEnabled) ||
        (isAppPromoEnabled && !data.isAppPromoEnabled) ||
        (isClickOutEnabled && !data.isClickOutEnabled)
      ) {
        setIsConfirmModalOpen(true);
      } else {
        void handleConfirmSave(data);
      }
    },
    [isRewardedAdsEnabled, isAppPromoEnabled, isClickOutEnabled, handleConfirmSave],
  );

  const handleSaveChangesClick = useCallback(() => {
    void handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const handleModalCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
  }, []);

  return (
    <div
      style={{
        padding: 16,
      }}>
      {hasSettingsFetchError && (
        <Alert severity='error' className='mb-4'>
          {translate(translationKey('Message.FailedToLoadPage', TranslationNamespace.Error))}
        </Alert>
      )}
      {isEligibilityFetched && !isUniverseEligible && (
        <Alert severity='warning' sx={{ marginBottom: 2 }}>
          {translateHTML(RewardedAdsIneligibleSettingsBannerKey, [
            {
              opening: 'eligibilityTabLinkStart',
              closing: 'eligibilityTabLinkEnd',
              content: EligibilityTabLink,
            },
          ])}
        </Alert>
      )}
      <div className={settingsContainer}>
        <Typography variant='h3'>
          {translate(
            translationKey('Heading.RewardedAds', TranslationNamespace.ImmersiveAdsAnalytics),
          )}
        </Typography>
        <AdServingSettings
          control={control}
          disabled={areSettingsDisabled || !servingEnabled}
          servingEnabledToggleDisabled={areSettingsDisabled}
        />
        <AdTypeSettings control={control} disabled={areSettingsDisabled || !servingEnabled} />
      </div>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 16, marginTop: 32 }}>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleCancel}
          disabled={areSettingsDisabled || !hasChanges}>
          {translate(translationKey('Label.Cancel', TranslationNamespace.ImmersiveAdsAnalytics))}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          onClick={handleSaveChangesClick}
          disabled={areSettingsDisabled || !hasChanges}>
          {translate(translationKey('Label.Save', TranslationNamespace.ImmersiveAdsAnalytics))}
        </Button>
      </div>
      <TranslatedSettingsStatusMessage status={status} />

      <Dialog open={isConfirmModalOpen} onClose={handleModalCancel}>
        <DialogTitle>
          {translate(
            translationKey('Heading.DisableAdType', TranslationNamespace.ImmersiveAdsAnalytics),
          )}
        </DialogTitle>
        <DialogContent>
          <div style={{ marginTop: 16 }}>
            <Typography>
              {translate(
                translationKey(
                  'Description.AdTypeOptOutConfirmation',
                  TranslationNamespace.ImmersiveAdsAnalytics,
                ),
              )}
            </Typography>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalCancel} variant='contained' color='secondary'>
            {translate(translationKey('Label.Cancel', TranslationNamespace.ImmersiveAdsAnalytics))}
          </Button>
          <Button
            onClick={() => {
              void handleSubmit(handleConfirmSave)();
            }}
            variant='contained'
            color='primaryBrand'>
            {translate(translationKey('Label.TurnOff', TranslationNamespace.ImmersiveAdsAnalytics))}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default withTranslation(AdsSettingsTabContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
