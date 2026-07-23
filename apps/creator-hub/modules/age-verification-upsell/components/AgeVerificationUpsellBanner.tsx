import React, { useCallback, useRef } from 'react';
import { Alert, AlertTitle, Link, Typography, Button, IconButton, CloseIcon } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useImpressionObserver } from '@modules/charts-generic';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useSettings } from '@modules/settings';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useAgeVerificationUpsellBannerStyles from './AgeVerificationUpsellBanner.styles';
import { useAgeVerificationUpsellContext } from '../context/AgeVerificationUpsellContext';

export enum AgeVerificationUpsellPage {
  Home = 'home',
  Creations = 'creations',
}

export type AgeVerificationUpsellBannerProps = {
  trackingPage: AgeVerificationUpsellPage;
  alertRedesignVariant?: string;
};

const AgeVerificationUpsellBannerComponent = ({
  trackingPage,
  alertRedesignVariant,
}: AgeVerificationUpsellBannerProps) => {
  const {
    settings: {
      ageVerificationUpsellGetStartedUrl,
      ageVerificationUpsellViewDetailsUrl,
      establishTrustUpsellGetStartedUrl,
      establishTrustUpsellViewDetailsUrl,
    },
  } = useSettings();
  const { isBannerVisible, isHighPriority, variant, dismissBanner } =
    useAgeVerificationUpsellContext();
  const {
    params: { enableImpactedExperiencesView },
  } = useIXPParameters(IXPLayers.CreatorDashboard);
  const { classes } = useAgeVerificationUpsellBannerStyles();
  const bannerRef = useRef<HTMLDivElement>(null);
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translate } = useTranslation();

  const sendImpressionEvent = useCallback(() => {
    if (!isBannerVisible) return;
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.AgeVerificationUpsellBanner,
      parameters: {
        page: trackingPage,
        variant,
        ...(alertRedesignVariant && { alertRedesignVariant }),
      },
    });
  }, [unifiedLogger, trackingPage, variant, alertRedesignVariant, isBannerVisible]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  const trackViewDetailsClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerClick,
      parameters: {
        page: trackingPage,
        action: 'viewDetails',
        variant,
        ...(alertRedesignVariant && { alertRedesignVariant }),
      },
    });
  }, [unifiedLogger, trackingPage, variant, alertRedesignVariant]);

  const trackCallToActionClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerClick,
      parameters: {
        page: trackingPage,
        action: 'callToAction',
        variant,
        ...(alertRedesignVariant && { alertRedesignVariant }),
      },
    });
  }, [unifiedLogger, trackingPage, variant, alertRedesignVariant]);

  const trackAndDismissClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerClick,
      parameters: {
        page: trackingPage,
        action: 'dismiss',
        variant,
        ...(alertRedesignVariant && { alertRedesignVariant }),
      },
    });
    dismissBanner();
  }, [unifiedLogger, dismissBanner, trackingPage, variant, alertRedesignVariant]);

  let titleTextKey: string;
  let bodyTextKey: string;
  let callToActionUrl: string;
  let viewDetailsUrl: string;
  switch (variant) {
    case 'establishTrust':
      titleTextKey = 'Title.EstablishTrustBanner';
      bodyTextKey = enableImpactedExperiencesView
        ? 'Label.EstablishTrustBanner2'
        : 'Label.EstablishTrustBanner';
      callToActionUrl = establishTrustUpsellGetStartedUrl;
      viewDetailsUrl = establishTrustUpsellViewDetailsUrl;
      break;
    case 'ageVerification':
    default:
      titleTextKey = 'Title.AgeVerificationBanner';
      bodyTextKey = 'Label.AgeVerificationBanner';
      callToActionUrl = ageVerificationUpsellGetStartedUrl;
      viewDetailsUrl = ageVerificationUpsellViewDetailsUrl;
      break;
  }

  if (!isBannerVisible) {
    return null;
  }

  return (
    <div ref={bannerRef}>
      <Alert
        className={classes.alertContainer}
        severity={variant === 'ageVerification' && isHighPriority ? 'warning' : 'info'}
        variant='filled'
        action={[
          <Button
            key='getStarted'
            href={callToActionUrl}
            onClick={trackCallToActionClick}
            className={classes.getStarted}
            color='inherit'
            size='small'>
            {translate('Label.AgeVerificationBannerGetStarted') || 'Get started'}
          </Button>,
          <IconButton
            key='dismiss'
            color='inherit'
            size='medium'
            aria-label='dismiss'
            onClick={trackAndDismissClick}>
            <CloseIcon />
          </IconButton>,
        ]}>
        <AlertTitle>{translate(titleTextKey)}</AlertTitle>
        <Typography variant='body2'>{translate(bodyTextKey)}</Typography>
        &nbsp;
        <Link
          className={classes.viewDetails}
          href={viewDetailsUrl}
          target='_blank'
          color='inherit'
          onClick={trackViewDetailsClick}>
          {translate('Label.AgeVerificationBannerViewDetails') || 'View details'}
        </Link>
      </Alert>
    </div>
  );
};

export const AgeVerificationUpsellBanner = withTranslation(AgeVerificationUpsellBannerComponent, [
  TranslationNamespace.Home,
]);
