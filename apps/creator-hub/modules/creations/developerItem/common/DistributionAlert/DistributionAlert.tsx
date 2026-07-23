import type { FunctionComponent, ReactNode } from 'react';
import React, { useMemo } from 'react';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, CloseIcon, IconButton, Link, Typography } from '@rbx/ui';
import type { TTypographyProps } from '@rbx/ui';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import OverviewInlineUrlTranslationLabel from '../../../common/components/OverviewInlineUrlTranslationLabel';
import type { OverviewInlineUrlTranslationLabelProps } from '../../../common/components/OverviewInlineUrlTranslationLabel';
import { DistributionErrorState } from '../common';
import useSettingsFormStyles from '../SettingsForm/SettingsForm.styles';

type TTypographyVariant = NonNullable<TTypographyProps['variant']>;

const { creatorStore, dashboard, docs } = creatorHub;

const SfxSuccessBannerDismissedKeyPrefix = 'sfxDistributionBannerDismissed';

export type DistributionAlertInfo = {
  link: ReactNode | undefined;
  message: string | undefined;
  translationLabelProps?: OverviewInlineUrlTranslationLabelProps;
  severity: 'success' | 'info' | 'warning' | 'error' | undefined;
  title: string | undefined;
};

export type DistributionAlertStyles = {
  alertStyle?: string;
  titleStyle?: string;
};

export type DistributionAlertProps = {
  distributionState: DistributionErrorState;
  assetId: number;
  isSfx?: boolean;
  isDistributed?: boolean;
};

const DistributionAlert: FunctionComponent<React.PropsWithChildren<DistributionAlertProps>> = ({
  distributionState,
  assetId,
  isSfx,
  isDistributed,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { distributionAlert, alertTitle },
  } = useSettingsFormStyles();

  const successBannerKey = `${SfxSuccessBannerDismissedKeyPrefix}_${assetId}_${String(!!isDistributed)}`;

  const [isSuccessBannerDismissed, setIsSuccessBannerDismissed] = useLocalStorage(
    successBannerKey,
    false,
  );

  const messageTypographyVariant: TTypographyVariant = 'body1';
  // TODO STM-4659: In the future distribution state will account for seller status
  // TODO STM-4659: This is in a switch case to make future work more easily added (when we account for seller status)
  const distributionAlertInfo: DistributionAlertInfo = useMemo(() => {
    switch (distributionState) {
      case DistributionErrorState.NotStartedAudioDistribution:
        return {
          link: (
            <Link
              href={dashboard.getAudioDistributionOnboardingUrl()}
              color='inherit'
              style={{ fontWeight: 'bold' }}
              data-testid='audio-distribution-onboarding-link'>
              {translate('Label.SubmitForReview')}
            </Link>
          ),
          message: translate('Message.UserNeedsApprovalToDistribute'),
          severity: 'success',
          title: translate('Label.GetDistributeApproval'),
        };
      case DistributionErrorState.PotentialPolicyViolation:
        return {
          link: (
            <Link
              href={www.getAppealsPortalUrl()}
              color='inherit'
              style={{ fontWeight: 'bold' }}
              data-testid='distribution-appeals-link'>
              {translate('Label.SubmitAppeal')}
            </Link>
          ),
          message: undefined,
          translationLabelProps: {
            anchorTargetUrl: docs.getCreatorStoreAssetModerationUrl(),
            closing: 'reqLinkEnd',
            typographyVariantOverride: messageTypographyVariant,
            linkVariantOverride: 'inherit',
            typographyColorOverride: 'inherit',
            opening: 'reqLinkStart',
            translationKey: 'Message.AssetMayViolateCommunityStandardsVerbose',
          },
          severity: 'error',
          title: translate('Label.AssetCannotBeDistributed'),
        };
      case DistributionErrorState.InvalidAssetType:
        return {
          link: undefined,
          message: translate('Message.AssetTypeNotAvailable'),
          severity: 'error',
          title: translate('Label.AssetCannotBeDistributed'),
        };
      case DistributionErrorState.PackageIneligible:
        return {
          link: undefined,
          message: undefined,
          translationLabelProps: {
            anchorTargetUrl: creatorHub.getRoadmapUrl(),
            closing: 'reqLinkEnd',
            typographyVariantOverride: messageTypographyVariant,
            linkVariantOverride: 'inherit',
            typographyColorOverride: 'inherit',
            opening: 'reqLinkStart',
            translationKey: 'Message.IneligiblePackageDistributor',
          },
          severity: 'error',
          title: translate('Label.AssetCannotBeDistributed'),
        };
      case DistributionErrorState.Unauthorized:
        return {
          link: undefined,
          message: translate('Message.NoPermissionToDistributeAsset'),
          severity: 'error',
          title: translate('Label.AssetCannotBeDistributed'),
        };
      case DistributionErrorState.IneligibleFiatSeller:
        return {
          link: undefined,
          message: undefined,
          translationLabelProps: {
            anchorTargetUrl: dashboard.getSellerOnboardingUrl(),
            closing: 'reqLinkEnd',
            typographyVariantOverride: messageTypographyVariant,
            linkVariantOverride: 'inherit',
            typographyColorOverride: 'inherit',
            opening: 'reqLinkStart',
            translationKey: 'Message.UserIneligilbleForFiatPricing',
          },
          severity: 'error',
          title: translate('Label.AssetCannotBeDistributed'),
        };
      case DistributionErrorState.RightsClaim:
        return {
          link: (
            <Link
              href={dashboard.getRightsManagerAssetUrl(assetId.toString())}
              color='inherit'
              style={{ fontWeight: 'bold' }}
              data-testid='review-claims-link'>
              {translate('Action.ReviewClaims')}
            </Link>
          ),
          message: translate('Message.CreationClaimed'),
          severity: 'error',
          title: translate('Label.CreationClaimed'),
        };
      case DistributionErrorState.Other:
        return {
          link: undefined,
          message: undefined,
          severity: 'error',
          title: translate('Label.AssetCannotBeDistributed'),
        };
      case DistributionErrorState.HiddenFromSearch:
        return {
          link: undefined,
          message: undefined,
          translationLabelProps: {
            anchorTargetUrl: docs.getCreatorStoreAssetModerationUrl(),
            closing: 'reqLinkEnd',
            typographyVariantOverride: messageTypographyVariant,
            linkVariantOverride: 'inherit',
            typographyColorOverride: 'inherit',
            opening: 'reqLinkStart',
            translationKey: 'Message.AssetNotVisibleOnCreatorStore',
          },
          severity: 'warning',
          title: translate('Label.AssetNotVisibleOnCreatorStore'),
        };
      case DistributionErrorState.Approved:
        return {
          link: (
            <Link
              href={dashboard.getAudioDistributionOnboardingUrl()}
              color='inherit'
              style={{ fontWeight: 'bold' }}
              data-testid='audio-distribution-onboarding-link'>
              {translate('Label.View')}
            </Link>
          ),
          message: undefined,
          severity: 'success',
          title: translate('Label.ApprovedToDistribute'),
        };
      case DistributionErrorState.AssetNotPublic:
      case DistributionErrorState.UserNotVerified:
      case DistributionErrorState.NotStarted:
      case DistributionErrorState.CompositeAssetBrokenDependencies:
      case DistributionErrorState.CompositeAssetIneligibleDependencies:
      case DistributionErrorState.CompositeAssetDependenciesLimit:
      default:
        return {
          link: undefined,
          message: undefined,
          severity: undefined,
          title: undefined,
        };
    }
  }, [assetId, distributionState, translate]);

  const distributionAlertStyles: DistributionAlertStyles = useMemo(() => {
    switch (distributionState) {
      case DistributionErrorState.NotStartedAudioDistribution:
        return {
          alertStyle: distributionAlert,
        };
      case DistributionErrorState.Approved:
        return {
          alertStyle: distributionAlert,
        };
      case DistributionErrorState.AssetNotPublic:
      case DistributionErrorState.UserNotVerified:
      case DistributionErrorState.InvalidAssetType:
      case DistributionErrorState.PotentialPolicyViolation:
      case DistributionErrorState.IneligibleFiatSeller:
      case DistributionErrorState.Other:
      case DistributionErrorState.Unauthorized:
      case DistributionErrorState.NotStarted:
      case DistributionErrorState.PackageIneligible:
      case DistributionErrorState.RightsClaim:
      case DistributionErrorState.CompositeAssetBrokenDependencies:
      case DistributionErrorState.CompositeAssetIneligibleDependencies:
      case DistributionErrorState.CompositeAssetDependenciesLimit:
      case DistributionErrorState.HiddenFromSearch:
      default:
        return {
          alertStyle: undefined,
        };
    }
  }, [distributionState, distributionAlert]);

  if (isSfx && distributionState === DistributionErrorState.NotStartedAudioDistribution) {
    return (
      <Alert
        severity='info'
        className='items-center'
        action={
          <Link
            href={dashboard.getAudioDistributionOnboardingUrl()}
            color='inherit'
            style={{ fontWeight: 'bold' }}
            data-testid='sfx-view-legal-agreements-link'>
            {translate('Label.View')}
          </Link>
        }>
        <AlertTitle color='inherit' className={clsx(alertTitle, 'margin-bottom-none')}>
          {translate('Message.AcknowledgeLegalAgreementsForDistribution')}
        </AlertTitle>
      </Alert>
    );
  }

  if (isSfx && distributionState === DistributionErrorState.Approved) {
    if (isSuccessBannerDismissed) {
      return null;
    }
    return (
      <Alert
        severity='success'
        className={clsx(distributionAlert, 'items-center')}
        action={
          <>
            <Link
              href={
                isDistributed === true
                  ? creatorStore.getAssetUrl(assetId)
                  : dashboard.getAudioDistributionOnboardingUrl()
              }
              color='inherit'
              style={{ fontWeight: 'bold', marginRight: 8 }}
              data-testid='sfx-distribution-approved-link'>
              {isDistributed ? translate('Label.View') : translate('Action.ViewLegalAgreements')}
            </Link>
            <IconButton
              size='small'
              aria-label={translate('Label.CloseDistributionBanner')}
              onClick={() => setIsSuccessBannerDismissed(true)}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </>
        }>
        <AlertTitle color='inherit' className='margin-bottom-none'>
          {translate(
            isDistributed
              ? 'Message.AudioIsDistributedOnCreatorStore'
              : 'Message.AudioCanBeDistributedOnCreatorStore',
          )}
        </AlertTitle>
      </Alert>
    );
  }

  const hasBody = !!(distributionAlertInfo.message ?? distributionAlertInfo.translationLabelProps);

  return (
    <Alert
      action={distributionAlertInfo.link}
      severity={distributionAlertInfo.severity}
      variant='standard'
      className={clsx(distributionAlertStyles.alertStyle, 'items-center')}>
      <AlertTitle color='inherit' className={clsx(alertTitle, !hasBody && 'margin-bottom-none')}>
        {distributionAlertInfo.title}
      </AlertTitle>
      {distributionAlertInfo.translationLabelProps ? (
        <OverviewInlineUrlTranslationLabel
          anchorTargetUrl={distributionAlertInfo.translationLabelProps.anchorTargetUrl}
          closing={distributionAlertInfo.translationLabelProps.closing}
          typographyVariantOverride={messageTypographyVariant}
          linkVariantOverride='inherit'
          typographyColorOverride='inherit'
          opening={distributionAlertInfo.translationLabelProps.opening}
          translationKey={distributionAlertInfo.translationLabelProps.translationKey}
        />
      ) : (
        <Typography variant={messageTypographyVariant} component='span'>
          {distributionAlertInfo.message}
        </Typography>
      )}
    </Alert>
  );
};

export default DistributionAlert;
