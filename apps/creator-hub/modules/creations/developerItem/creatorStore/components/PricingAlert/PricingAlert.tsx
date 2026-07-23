import React, { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Link, Typography } from '@rbx/ui';
import {
  GetRequirementsResponse,
  Restriction,
} from '@rbx/clients/marketplacePublishingRequirementsApi';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import usePricingAlertStyles from './PricingAlert.styles';

export type PricingAlertProps = {
  assetConfigurationRequirements: GetRequirementsResponse;
};

type PricingAlertInfo = {
  actionLink: ReactNode | undefined;
  message: string | undefined;
  severity: 'success' | 'info' | 'error';
  title: string;
};

const PricingAlert: FunctionComponent<PricingAlertProps> = ({ assetConfigurationRequirements }) => {
  const { translate } = useTranslation();
  const { classes: styles } = usePricingAlertStyles();

  if (assetConfigurationRequirements.pricing?.isAllowed) {
    return null;
  }

  const pricingRestrictions = assetConfigurationRequirements.pricing?.restrictions;

  const getPricingAlertInfo = (): PricingAlertInfo => {
    if (pricingRestrictions?.includes(Restriction.SellerAccountNotOnboarded)) {
      return {
        title: translate('Label.CompleteOnboarding'),
        message: translate('Message.UserNeedsApprovalToPrice'),
        severity: 'info',
        actionLink: (
          <Link
            href={dashboard.getSellerOnboardingUrl()}
            color='inherit'
            data-testid='fiat-onboarding-link'>
            {translate('Label.Register')}
          </Link>
        ),
      };
    }

    // If there is already an UnsupportedAssetOwner restriction, we should
    // show the default pricing alert rather than this AAC-specific one
    const hasCompositeAssetUnverifiedVersionPricingRestriction =
      pricingRestrictions?.includes(Restriction.CompositeAssetLatestVersionUnverified) ||
      pricingRestrictions?.includes(Restriction.CompositeAssetRevertedToUnevaluatedVersion);
    if (
      !pricingRestrictions?.includes(Restriction.UnsupportedAssetOwner) &&
      hasCompositeAssetUnverifiedVersionPricingRestriction
    ) {
      return {
        title: translate('Label.PricingDisabled'),
        message: translate('Label.NeedsReuploadForPricing'),
        severity: 'info',
        actionLink: undefined,
      };
    }

    return {
      title: translate('Label.PricingDisabled'),
      message: '',
      severity: 'error',
      actionLink: undefined,
    };
  };

  const { title, message, severity, actionLink } = getPricingAlertInfo();

  return (
    <Alert action={actionLink} severity={severity} variant='standard' className={styles.alert}>
      <AlertTitle className={styles.alertTitle}>{title}</AlertTitle>
      <Typography variant='smallLabel2' component='span'>
        {message}
      </Typography>
    </Alert>
  );
};

export default PricingAlert;
