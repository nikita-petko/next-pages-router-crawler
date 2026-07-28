import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Switch,
  Typography,
} from '@rbx/ui';
import { isAssetPrivacyOptOutSurveyEnabled } from '@generated/flags/contentAccessAndInventory';
import AssetPrivacyOpenUseFollowUpDialog from '@modules/asset-privacy/components/AssetPrivacyOpenUseFollowUpDialog';
import type { AssetPrivacyOptOutSurveyPayload } from '@modules/asset-privacy/types/assetPrivacyOptOutSurvey';
import { sendAssetPrivacyOptOutSurveySubmittedEvent } from '@modules/asset-privacy/utils/sendAssetPrivacyOptOutSurveySubmittedEvent';
import { useAuthentication } from '@modules/authentication/providers';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { ASSET_ACCESS_PRIVACY } from '@modules/miscellaneous/common/constants/linkConstants';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AssetPrivacyLevel,
  useGetUserAssetPrivacyDefault,
  useUpdateUserAssetPrivacyDefault,
  useGetIsUserEligibleForBeta,
} from '@modules/react-query/assetPermissions';
import useSnackbarAdvancedResponse from '../components/ResponseSnackbarAlert';
import useCreatorSettingsAdvancedContainerStyles from './CreatorSettingsAdvancedContainer.styles';

const handleSeeHowItWorksButtonClicked = () => {
  window.open(ASSET_ACCESS_PRIVACY, '_blank', 'noopener,noreferrer');
};

const CreatorSettingsAdvancedContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate, translateHTML } = useTranslation();
  const { classes: styles } = useCreatorSettingsAdvancedContainerStyles();
  const { user } = useAuthentication();
  const { value: showAssetPrivacyOptOutSurvey } = useFlag(isAssetPrivacyOptOutSurveyEnabled);
  const {
    data: assetPrivacyDefaultRestricted,
    isError: assetPrivacyDefaultError,
    isPending: assetPrivacyDefaultLoading,
  } = useGetUserAssetPrivacyDefault(user?.id ?? -1, !!user?.id);
  const { data: isUserEligibleForBeta, isPending: isUserEligibleForBetaLoading } =
    useGetIsUserEligibleForBeta(user?.id ?? -1, !!user?.id);
  const { mutateAsync: updateAssetPrivacyDefault, isPending: updateAssetPrivacyDefaultLoading } =
    useUpdateUserAssetPrivacyDefault();
  const [isAssetPrivacyDialogOpen, setIsAssetPrivacyDialogOpen] = useState(false);
  const [assetPrivacyDialogStep, setAssetPrivacyDialogStep] = useState<'warning' | 'followUp'>(
    'warning',
  );
  const [isAssetPrivacyOpenUsePending, setIsAssetPrivacyOpenUsePending] = useState(false);
  const showSnackbarMessage = useSnackbarAdvancedResponse();
  const { trackerClient } = useEventTrackerProvider();

  const setAssetPrivacyToRestricted = useCallback(async () => {
    void updateAssetPrivacyDefault(
      {
        creatorId: user?.id ?? -1,
        isRestricted: true,
      },
      {
        onError: () => {
          showSnackbarMessage('error', translate('Message.AssetPrivacySaveUnsuccessful'));
        },
        onSuccess: () => {
          showSnackbarMessage('success', translate('Message.AssetPrivacyRestrictedSuccess'));
        },
      },
    );
  }, [showSnackbarMessage, translate, updateAssetPrivacyDefault, user?.id]);

  const setAssetPrivacyToOpenUse = useCallback(async () => {
    setIsAssetPrivacyOpenUsePending(true);
    void updateAssetPrivacyDefault(
      {
        creatorId: user?.id ?? -1,
        isRestricted: false,
      },
      {
        onError: () => {
          setIsAssetPrivacyOpenUsePending(false);
          showSnackbarMessage('error', translate('Message.AssetPrivacySaveUnsuccessful'));
        },
        onSuccess: () => {
          setIsAssetPrivacyOpenUsePending(false);
          showSnackbarMessage('success', translate('Message.AssetPrivacyOpenUseSuccess'));
        },
      },
    );
  }, [showSnackbarMessage, translate, updateAssetPrivacyDefault, user?.id]);

  const handleAssetPrivacyOptOutSurveyClose = useCallback(() => {
    setIsAssetPrivacyDialogOpen(false);
  }, []);

  const handleAssetPrivacyOptOutSurveySubmit = useCallback(
    (payload: AssetPrivacyOptOutSurveyPayload) => {
      sendAssetPrivacyOptOutSurveySubmittedEvent({
        trackerClient,
        creatorType: 'user',
        payload,
      });
      setIsAssetPrivacyDialogOpen(false);
    },
    [trackerClient],
  );

  const handleAssetPrivacyToggleClicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isRestricted = event.target.checked;
    if (isRestricted) {
      void setAssetPrivacyToRestricted();
    } else {
      // If the user is trying to change from Restricted to Open Use, they must confirm in the dialog
      setAssetPrivacyDialogStep('warning');
      setIsAssetPrivacyDialogOpen(true);
    }
  };

  if (assetPrivacyDefaultError) {
    return <ErrorPage errorCode={StatusCodes.BAD_REQUEST} />;
  }

  if (assetPrivacyDefaultLoading || isUserEligibleForBetaLoading) {
    return <PageLoading />;
  }

  return (
    <div className={styles.container}>
      <Grid className={styles.grid} container direction='column'>
        {isUserEligibleForBeta && (
          <>
            <Grid className={styles.statusLabelColumnGap} item container direction='column'>
              <Grid item container direction='row' alignItems='center'>
                <Typography variant='h4'>{translate('Heading.AssetPrivacy')}</Typography>
              </Grid>
              <Grid item container direction='row' alignItems='center'>
                <Typography variant='body1' color='secondary'>
                  {translate('Description.AssetPrivacy')}
                </Typography>
                <Button className={styles.dialogButton} onClick={handleSeeHowItWorksButtonClicked}>
                  <Typography variant='subtitle2'>{translate('Label.SeeHowItWorks')}</Typography>
                </Button>
              </Grid>
              <Grid item container direction='row' alignItems='center'>
                <Switch
                  aria-label={translate('Label.AllowRestrictedAssets')}
                  checked={
                    assetPrivacyDefaultRestricted === AssetPrivacyLevel.Restricted &&
                    !isAssetPrivacyOpenUsePending
                  }
                  onChange={handleAssetPrivacyToggleClicked}
                  loading={updateAssetPrivacyDefaultLoading}
                />
                <Typography variant='body1'>{translate('Label.AllowRestrictedAssets')}</Typography>
              </Grid>
            </Grid>
            <Dialog open={isAssetPrivacyDialogOpen && assetPrivacyDialogStep === 'warning'}>
              <DialogTitle>{translate('Heading.NewAssetsAsOpenUse')} </DialogTitle>
              <DialogContent>
                <Typography variant='body2' color='secondary'>
                  {translate('Description.TurnOffAssetPrivacy')}{' '}
                  {translateHTML('Label.LearnMoreAboutAssetPrivacy', [
                    {
                      opening: 'aStart',
                      closing: 'aEnd',
                      content(chunks: React.ReactNode) {
                        return (
                          <Link
                            href={ASSET_ACCESS_PRIVACY}
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{ textDecoration: 'none' }}>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                </Typography>
                <br />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setIsAssetPrivacyDialogOpen(false);
                  }}>
                  {translate('Action.Cancel')}
                </Button>
                <Button
                  onClick={() => {
                    void setAssetPrivacyToOpenUse();
                    if (showAssetPrivacyOptOutSurvey) {
                      setAssetPrivacyDialogStep('followUp');
                    } else {
                      setIsAssetPrivacyDialogOpen(false);
                    }
                  }}>
                  {translate('Action.OK')}
                </Button>
              </DialogActions>
            </Dialog>
            <AssetPrivacyOpenUseFollowUpDialog
              open={isAssetPrivacyDialogOpen && assetPrivacyDialogStep === 'followUp'}
              surveyContext='user'
              onClose={handleAssetPrivacyOptOutSurveyClose}
              onSubmit={handleAssetPrivacyOptOutSurveySubmit}
            />
          </>
        )}
      </Grid>
    </div>
  );
};

export default withTranslation(CreatorSettingsAdvancedContainer, [
  TranslationNamespace.Advanced,
  TranslationNamespace.Settings,
  TranslationNamespace.DevEx,
  TranslationNamespace.AssetPrivacy,
]);
