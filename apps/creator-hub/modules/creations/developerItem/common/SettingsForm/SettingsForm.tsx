import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { FormControlLabel, Grid, Link, Switch, Typography } from '@rbx/ui';
import type { DeveloperItemDistributionQuota } from '@modules/clients/publish';
import { QuotaDurationToDaysCount } from '@modules/clients/publish';
import type { CreatorType } from '@modules/miscellaneous/common';
import useConversionTracker from '@modules/miscellaneous/hooks/useConversionTracker';
import { creatorHub, terms, www } from '@modules/miscellaneous/urls';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { DistributionErrorState } from '../common';
import CompositeAssetDependenciesAlert from '../CompositeAssetDependencies/alert/CompositeAssetDependenciesAlert';
import { DistributionErrorStateToDependenciesAlertType } from '../CompositeAssetDependencies/constants/alertTypeConstants';
import DistributionAlert from '../DistributionAlert/DistributionAlert';
import useSettingsFormStyles from './SettingsForm.styles';

const { docs } = creatorHub;

const HiddenFromSearchBannerImpressionTracker: FunctionComponent<{
  assetId: number;
  creatorId: number;
  children: React.ReactNode;
}> = ({ assetId, creatorId, children }) => {
  const { ref } = useConversionTracker<HTMLDivElement>(
    'CreatorStoreHiddenFromSearchBannerImpression',
    {
      additionalParams: {
        assetId: String(assetId),
        creatorId: String(creatorId),
      },
    },
  );
  return <div ref={ref}>{children}</div>;
};

export type SettingsFormProps = {
  assetId: number;
  creator?: { id: number; type: CreatorType };
  distributionErrorState?: DistributionErrorState;
  isBackendFiatProductDistributed?: boolean;
  isDistributed?: boolean;
  isDistributionAvailable?: boolean;
  isSfx?: boolean;
  quota?: DeveloperItemDistributionQuota;
  shouldDisableDistribution?: boolean;
};

const SettingsForm: FunctionComponent<React.PropsWithChildren<SettingsFormProps>> = ({
  assetId,
  creator,
  distributionErrorState,
  isBackendFiatProductDistributed = false,
  isDistributed,
  isDistributionAvailable = true,
  isSfx = false,
  quota,
  shouldDisableDistribution = false,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const enableHiddenFromSearchVisibilityAlert =
    frontendFlags[FrontendFlagName.FrontendFlagEnableHiddenFromSearchVisibilityAlert] ?? false;
  const {
    classes: {
      distributionAlertContainer,
      distributionLabel,
      distributionText,
      formContainer,
      switchContainer,
    },
  } = useSettingsFormStyles();
  const { control } = useFormContext();

  const isDistributionDisabled = useMemo(
    () =>
      shouldDisableDistribution ||
      (distributionErrorState !== DistributionErrorState.Approved &&
        !!distributionErrorState &&
        distributionErrorState !== DistributionErrorState.HiddenFromSearch) ||
      (quota && quota.usage >= quota.capacity && !isDistributed),
    [distributionErrorState, isDistributed, quota, shouldDisableDistribution],
  );

  const distributionInfo = useMemo(() => {
    switch (distributionErrorState) {
      case DistributionErrorState.UserNotVerified:
        return translateHTML('Message.UserNotVerified', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(accountSettingText) {
              return (
                <Link href={www.getAccountSettingsUrl()} target='_blank'>
                  {accountSettingText}
                </Link>
              );
            },
          },
        ]);
      case DistributionErrorState.AssetNotPublic:
        return translate('Message.AssetNotPublic');
      case undefined:
      case DistributionErrorState.InvalidAssetType:
      case DistributionErrorState.PotentialPolicyViolation:
      case DistributionErrorState.IneligibleFiatSeller:
      case DistributionErrorState.Other:
      case DistributionErrorState.Unauthorized:
      case DistributionErrorState.NotStarted:
      case DistributionErrorState.NotStartedAudioDistribution:
      case DistributionErrorState.Approved:
      case DistributionErrorState.PackageIneligible:
      case DistributionErrorState.RightsClaim:
      case DistributionErrorState.CompositeAssetBrokenDependencies:
      case DistributionErrorState.CompositeAssetIneligibleDependencies:
      case DistributionErrorState.CompositeAssetDependenciesLimit:
      case DistributionErrorState.HiddenFromSearch:
      default:
        return translateHTML('Message.DistributionCaption', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(learnMoreText) {
              return (
                <Link href={terms.getAssetDistributionUrl()} target='_blank'>
                  {learnMoreText}
                </Link>
              );
            },
          },
        ]);
    }
  }, [distributionErrorState, translate, translateHTML]);

  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return formatter.format;
  }, [locale]);

  const quotaInfo = useMemo(() => {
    if (!quota) {
      return null;
    }
    if (quota.usage === 0) {
      return translate('Message.ShareLimit', {
        capacity: quota.capacity.toString(),
        duration: QuotaDurationToDaysCount[quota.duration],
      });
    }
    if (quota.usage > 0 && quota.usage < quota.capacity) {
      return translate('Message.SharedCount', {
        number: (quota.capacity - quota.usage).toString(),
        date: quota.expirationTime ? dateFormatter(quota.expirationTime) : '',
      });
    }
    return translate('Message.ShareExceed', { date: dateFormatter(quota.expirationTime) });
  }, [quota, translate, dateFormatter]);

  const distributionAlert = useMemo(() => {
    if (
      distributionErrorState === DistributionErrorState.HiddenFromSearch &&
      isBackendFiatProductDistributed &&
      enableHiddenFromSearchVisibilityAlert
    ) {
      return (
        <HiddenFromSearchBannerImpressionTracker assetId={assetId} creatorId={creator?.id ?? 0}>
          <DistributionAlert
            key={`${assetId}_${String(!!isDistributed)}`}
            distributionState={distributionErrorState}
            assetId={assetId}
            isSfx={isSfx}
            isDistributed={isDistributed}
          />
        </HiddenFromSearchBannerImpressionTracker>
      );
    }
    if (distributionErrorState && creator) {
      const alertType = DistributionErrorStateToDependenciesAlertType[distributionErrorState];
      if (alertType !== undefined) {
        return (
          <CompositeAssetDependenciesAlert
            alertType={alertType}
            parentAssetId={assetId}
            parentCreator={creator}
          />
        );
      }
    }
    if (
      distributionErrorState !== undefined &&
      [
        DistributionErrorState.NotStartedAudioDistribution,
        DistributionErrorState.InvalidAssetType,
        DistributionErrorState.PotentialPolicyViolation,
        DistributionErrorState.Unauthorized,
        DistributionErrorState.Other,
        DistributionErrorState.Approved,
        DistributionErrorState.IneligibleFiatSeller,
        DistributionErrorState.PackageIneligible,
        DistributionErrorState.RightsClaim,
      ].includes(distributionErrorState)
    ) {
      return (
        <DistributionAlert
          key={`${assetId}_${String(!!isDistributed)}`}
          distributionState={distributionErrorState}
          assetId={assetId}
          isSfx={isSfx}
          isDistributed={isDistributed}
        />
      );
    }

    return null;
  }, [
    assetId,
    creator,
    distributionErrorState,
    enableHiddenFromSearchVisibilityAlert,
    isBackendFiatProductDistributed,
    isSfx,
    isDistributed,
  ]);

  return (
    <Grid container item XSmall={12} classes={{ root: formContainer }}>
      {isDistributionAvailable && (
        <Grid container item XSmall={12} direction='row'>
          <Grid item XSmall={12}>
            <Typography
              variant='body1'
              color={isDistributionDisabled ? 'disabled' : 'secondary'}
              classes={{ root: distributionText }}>
              {distributionInfo}
            </Typography>
          </Grid>
          {distributionAlert && (
            <Grid item XSmall={12} classes={{ root: distributionAlertContainer }}>
              {distributionAlert}
            </Grid>
          )}
          <Controller
            name='isItemDistributed'
            control={control}
            render={({ field }) => (
              <FormControlLabel
                classes={{ root: switchContainer }}
                control={
                  <Switch
                    data-testid='distribution-switch'
                    aria-label={translate('Label.DistributeOnCreatorStore')}
                    onChange={(e) => field.onChange(e.target.checked)}
                    checked={!!field.value}
                  />
                }
                disabled={isDistributionDisabled}
                label={
                  <>
                    <Typography
                      variant='body1'
                      color={isDistributionDisabled ? 'disabled' : 'primary'}
                      classes={{ root: distributionLabel }}>
                      {translate('Label.DistributeOnCreatorStore')}{' '}
                    </Typography>
                    {quota && (
                      <>
                        <br />
                        <Typography
                          variant='smallLabel2'
                          color={isDistributionDisabled ? 'disabled' : 'primary'}>
                          {quotaInfo}
                          <span>{` `}</span>
                          <Link href={docs.getCreatorStorePublishingUrl()} target='_blank'>
                            {translate('Message.WhatIsMyLimit')}
                          </Link>
                        </Typography>
                      </>
                    )}
                  </>
                }
              />
            )}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default SettingsForm;
