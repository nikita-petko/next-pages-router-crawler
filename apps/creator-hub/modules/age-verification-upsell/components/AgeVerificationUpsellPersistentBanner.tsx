import { useCallback, useRef } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Link, Typography, Button } from '@rbx/ui';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { useAgeVerificationUpsellContext } from '../context/AgeVerificationUpsellContext';
import type { AgeVerificationUpsellPage } from './AgeVerificationUpsellBanner';
import useAgeVerificationUpsellBannerStyles from './AgeVerificationUpsellBanner.styles';

type AgeVerificationUpsellPersistentBannerProps = {
  trackingPage: AgeVerificationUpsellPage;
};

const AgeVerificationUpsellPersistentBannerComponent = ({
  trackingPage,
}: AgeVerificationUpsellPersistentBannerProps) => {
  const {
    settings: {
      ageVerificationUpsellGetStartedUrl,
      ageVerificationUpsellViewDetailsUrl,
      establishTrustUpsellGetStartedUrl,
      establishTrustUpsellViewDetailsUrl,
    },
  } = useSettings();
  const { isBannerEligible, isHighPriority, variant } = useAgeVerificationUpsellContext();
  const { classes } = useAgeVerificationUpsellBannerStyles();
  const bannerRef = useRef<HTMLDivElement>(null);
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translate } = useTranslation();

  const sendImpressionEvent = useCallback(() => {
    if (!isBannerEligible) {
      return;
    }
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.AgeVerificationUpsellBanner,
      parameters: {
        page: trackingPage,
        variant,
        persistent: 'true',
      },
    });
  }, [unifiedLogger, trackingPage, variant, isBannerEligible]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  const trackViewDetailsClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerClick,
      parameters: {
        page: trackingPage,
        action: 'viewDetails',
        variant,
        persistent: 'true',
      },
    });
  }, [unifiedLogger, trackingPage, variant]);

  const trackCallToActionClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerClick,
      parameters: {
        page: trackingPage,
        action: 'callToAction',
        variant,
        persistent: 'true',
      },
    });
  }, [unifiedLogger, trackingPage, variant]);

  let titleTextKey: string;
  let bodyTextKey: string;
  let callToActionUrl: string;
  let viewDetailsUrl: string;
  switch (variant) {
    case 'establishTrust':
      titleTextKey = 'Title.EstablishTrustBanner';
      bodyTextKey = 'Label.EstablishTrustBanner2';
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

  if (!isBannerEligible) {
    return null;
  }

  return (
    <div ref={bannerRef}>
      <Alert
        className={classes.alertContainer}
        severity={variant === 'ageVerification' && isHighPriority ? 'warning' : 'info'}
        variant='filled'
        action={
          <Button
            key='getStarted'
            href={callToActionUrl}
            onClick={trackCallToActionClick}
            className={classes.getStarted}
            color='inherit'
            size='small'>
            {translate('Label.AgeVerificationBannerGetStarted') || 'Get started'}
          </Button>
        }>
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

export default withTranslation(AgeVerificationUpsellPersistentBannerComponent, [
  TranslationNamespace.Home,
]);
