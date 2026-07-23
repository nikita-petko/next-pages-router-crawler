import React, { FunctionComponent, useMemo, Fragment } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FormControlLabel, Grid, Link, Switch, Typography } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { CreatorType, urls } from '@modules/miscellaneous/common';
import { DeveloperItemDistributionQuota, QuotaDurationToDaysCount } from '@modules/clients';
import useConversionTracker from '@modules/miscellaneous/hooks/useConversionTracker';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import useSettingsFormStyles from './SettingsForm.styles';
import DistributionAlert from '../DistributionAlert/DistributionAlert';
import CompositeAssetDependenciesAlert from '../CompositeAssetDependencies/alert/CompositeAssetDependenciesAlert';
import {
  DependenciesAlertType,
  DistributionErrorStateToDependenciesAlertType,
} from '../CompositeAssetDependencies/constants/alertTypeConstants';
import { DistributionErrorState } from '../common';

const {
  www,
  terms,
  creatorHub: { docs },
} = urls;

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
  quota?: DeveloperItemDistributionQuota;
};

const SettingsForm: FunctionComponent<React.PropsWithChildren<SettingsFormProps>> = ({
  assetId,
  creator,
  distributionErrorState,
  isBackendFiatProductDistributed = false,
  isDistributed,
  isDistributionAvailable = true,
  quota,
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
      (distributionErrorState !== DistributionErrorState.Approved &&
        !!distributionErrorState &&
        distributionErrorState !== DistributionErrorState.HiddenFromSearch) ||
      (quota && quota.usage >= quota.capacity && !isDistributed),
    [distributionErrorState, isDistributed, quota],
  );

  const distributionInfo = useMemo(() => {
    switch (distributionErrorState) {
      case DistributionErrorState.UserNotVerified:
        return translateHTML('Message.UserNotVerified', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            // eslint-disable-next-line react/no-unstable-nested-components -- essential link
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
      default:
        return translateHTML('Message.DistributionCaption', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            // eslint-disable-next-line react/no-unstable-nested-components -- essential link
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
          <DistributionAlert distributionState={distributionErrorState} assetId={assetId} />
        </HiddenFromSearchBannerImpressionTracker>
      );
    }
    if (
      distributionErrorState &&
      distributionErrorState in DistributionErrorStateToDependenciesAlertType &&
      creator
    ) {
      return (
        <CompositeAssetDependenciesAlert
          alertType={
            DistributionErrorStateToDependenciesAlertType[
              distributionErrorState
            ] as DependenciesAlertType
          }
          parentAssetId={assetId}
          parentCreator={creator}
        />
      );
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
      return <DistributionAlert distributionState={distributionErrorState} assetId={assetId} />;
    }

    return null;
  }, [
    assetId,
    creator,
    distributionErrorState,
    enableHiddenFromSearchVisibilityAlert,
    isBackendFiatProductDistributed,
  ]);

  return (
    <Grid container item XSmall={12} classes={{ root: formContainer }}>
      {isDistributionAvailable && (
        <Grid container item XSmall={12} direction='row'>
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
                  <Fragment>
                    <Typography
                      variant='body1'
                      color={isDistributionDisabled ? 'disabled' : 'primary'}
                      classes={{ root: distributionLabel }}>
                      {translate('Label.DistributeOnCreatorStore')}{' '}
                    </Typography>
                    <Typography
                      variant='smallLabel2'
                      color={isDistributionDisabled ? 'disabled' : 'secondary'}
                      classes={{ root: distributionText }}>
                      {distributionInfo}
                    </Typography>
                    {quota && (
                      <Fragment>
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
                      </Fragment>
                    )}
                  </Fragment>
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
