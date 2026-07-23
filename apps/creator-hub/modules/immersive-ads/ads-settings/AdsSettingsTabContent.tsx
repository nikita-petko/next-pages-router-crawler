import React, { FC, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Link,
} from '@rbx/ui';
import { urls } from '@modules/miscellaneous/common';
import { useUniverseAdsSettings } from '../contexts';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import AdTypeSettings from './AdTypeSettings';
import { AdSettingsFormData } from './interfaces';
import AdServingSettings from './AdServingSettings';
import SettingsStatusMessage, { SettingsStatusType } from './SettingsStatusMessage';

const {
  creatorHub: { docs },
} = urls;

const RewardedVideoDocLink = (chunks: React.ReactNode) => {
  return (
    <Link href={docs.getRewardedVideoUrl()} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

const AdsSettingsTabContent: FC<React.PropsWithChildren<unknown>> = () => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const {
    classes: { settingsContainer },
  } = useImmersiveAdsPageStyles();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [status, setStatus] = useState<SettingsStatusType>(null);
  const {
    state: { isAppPromoEnabled, isClickOutEnabled, isExcludeLikelyPayersEnabled, isError },
    updateUniverseAdsSettings,
  } = useUniverseAdsSettings();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<AdSettingsFormData>({
    defaultValues: {
      isAppPromoEnabled,
      isClickOutEnabled,
      isExcludeLikelyPayersEnabled,
    },
  });

  useEffect(() => {
    if (!status) return;
    setTimeout(() => {
      setStatus(null);
    }, 4000);
  }, [status]);

  const hasChanges = isDirty;

  // Update form values when context state changes
  useEffect(() => {
    reset({
      isAppPromoEnabled,
      isClickOutEnabled,
      isExcludeLikelyPayersEnabled,
    });
  }, [isAppPromoEnabled, isClickOutEnabled, isExcludeLikelyPayersEnabled, reset]);

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
      isAppPromoEnabled,
      isClickOutEnabled,
      isExcludeLikelyPayersEnabled,
    });
    setStatus(null);
  }, [isAppPromoEnabled, isClickOutEnabled, isExcludeLikelyPayersEnabled, reset]);

  const handleConfirmSave = useCallback(
    async (data: AdSettingsFormData) => {
      setIsConfirmModalOpen(false);
      setStatus(null); // Clear any existing status

      try {
        await updateUniverseAdsSettings(
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
        (isAppPromoEnabled && !data.isAppPromoEnabled) ||
        (isClickOutEnabled && !data.isClickOutEnabled)
      ) {
        setIsConfirmModalOpen(true);
      } else {
        handleConfirmSave(data);
      }
    },
    [isAppPromoEnabled, isClickOutEnabled, handleConfirmSave],
  );

  const handleSaveChangesClick = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const handleModalCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
  }, []);

  // Show error alert if there's an error fetching settings
  if (isError) {
    return (
      <div style={{ padding: 16 }}>
        <Alert severity='info'>
          {translateHTML(
            translationKey(
              'Description.RewardedVideoNotEnabledContent',
              TranslationNamespace.ImmersiveAdsAnalytics,
            ),
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: RewardedVideoDocLink,
              },
            ],
          )}
        </Alert>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
      }}>
      <div className={settingsContainer}>
        <Typography variant='h3'>Rewarded Video</Typography>
        <AdServingSettings control={control} />
        <AdTypeSettings control={control} />
      </div>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 16, marginTop: 32 }}>
        <Button variant='contained' color='secondary' onClick={handleCancel} disabled={!hasChanges}>
          {translate(translationKey('Label.Cancel', TranslationNamespace.ImmersiveAdsAnalytics))}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          onClick={handleSaveChangesClick}
          disabled={!hasChanges}>
          {translate(translationKey('Label.Save', TranslationNamespace.ImmersiveAdsAnalytics))}
        </Button>
      </div>
      <SettingsStatusMessage status={status} />

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
            onClick={() => handleSubmit(handleConfirmSave)()}
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
