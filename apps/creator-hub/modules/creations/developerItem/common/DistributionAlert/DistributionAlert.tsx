import React, { FunctionComponent, ReactNode, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Link, Typography } from '@rbx/ui';
import { urls } from '@modules/miscellaneous/common';
import {
  OverviewInlineUrlTranslationLabel,
  OverviewInlineUrlTranslationLabelProps,
} from '@modules/creations/common';
import type { TTypographyProps } from '@rbx/ui';
import { creatorHub } from '@modules/miscellaneous/common/urls';
import useSettingsFormStyles from '../SettingsForm/SettingsForm.styles';
import { DistributionErrorState } from '../common';

type TTypographyVariant = NonNullable<TTypographyProps['variant']>;

const {
  www,
  creatorHub: { dashboard, docs },
} = urls;

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
};

const DistributionAlert: FunctionComponent<React.PropsWithChildren<DistributionAlertProps>> = ({
  distributionState,
  assetId,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { distributionAlert, alertTitle },
  } = useSettingsFormStyles();

  const messageTypographyVariant: TTypographyVariant = 'smallLabel2';
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
              whiteSpace='nowrap'
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
              whiteSpace='nowrap'
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
              whiteSpace='nowrap'
              data-testid='audio-distribution-onboarding-link'>
              {translate('Label.View')}
            </Link>
          ),
          message: undefined,
          severity: 'success',
          title: translate('Label.ApprovedToDistribute'),
        };
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
      default:
        return {
          alertStyle: undefined,
        };
    }
  }, [distributionState, distributionAlert]);

  return (
    <Alert
      action={distributionAlertInfo.link}
      severity={distributionAlertInfo.severity}
      variant='standard'
      className={distributionAlertStyles.alertStyle}>
      <AlertTitle className={alertTitle}>{distributionAlertInfo.title}</AlertTitle>
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
