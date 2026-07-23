import { memo, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard, docs } from '@modules/miscellaneous/urls/creatorHub';
import PromotionBanner from '@modules/monetization-shared/promotion-banner/PromotionBanner';
import type { PromotionBannerPageKeys } from './useManagedPricingPromotionBanner';
import { useManagedPricingPromotionBanner } from './useManagedPricingPromotionBanner';

type ManagedPricingPromotionBannerProps = {
  universeId: number;
  page: keyof typeof PromotionBannerPageKeys;
  fromRegionalPricing?: boolean;
  emphasizePrimaryButton?: boolean;
  className?: string;
};

const promoBannerIllustrationLink = `${process.env.assetPathPrefix}/regional-pricing/promo-banner-illustration.png`;

function ManagedPricingPromotionBanner({
  universeId,
  page,
  fromRegionalPricing,
  emphasizePrimaryButton,
  className,
}: ManagedPricingPromotionBannerProps) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ManagedPricing);
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const { isOpen, close, closeManagedPricingOverviewBanner } = useManagedPricingPromotionBanner({
    universeId,
    page,
  });

  const handlePrimaryButtonClick = useCallback(() => {
    closeManagedPricingOverviewBanner();
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/ManagedPricingPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        page,
        action: 'primary',
      },
    });
  }, [unifiedLogger, universeId, page, closeManagedPricingOverviewBanner]);

  const handleSecondaryButtonClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/ManagedPricingPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        page,
        action: 'secondary',
      },
    });
  }, [unifiedLogger, universeId, page]);

  const handleDismissBanner = useCallback(() => {
    close();
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/ManagedPricingPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        page,
        action: 'dismiss',
      },
    });
  }, [close, unifiedLogger, universeId, page]);

  const bannerRef = useRef<HTMLDivElement>(null);

  const sendImpressionEvent = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/banner/ManagedPricingPromotionBannerImpression',
      parameters: {
        universe_id: universeId.toString(),
        page,
      },
    });
  }, [unifiedLogger, universeId, page]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  if (!isOpen) {
    return null;
  }

  const isManagedPricingPage = page.includes('managed-pricing');

  return (
    <PromotionBanner
      ref={bannerRef}
      title={
        fromRegionalPricing
          ? translate('Heading.ManagedPricingPromotionBanner.RegionalPricing')
          : translate('Heading.ManagedPricingPromotionBanner')
      }
      description={
        fromRegionalPricing
          ? translate('Description.ManagedPricingPromotionBanner.RegionalPricing')
          : translate('Description.ManagedPricingPromotionBanner')
      }
      primary={
        <Button
          asChild
          variant={isManagedPricingPage || emphasizePrimaryButton ? 'Emphasis' : 'Standard'}
          size='Medium'>
          <NextLink
            href={dashboard.getManagedPricingUrl(
              universeId,
              isManagedPricingPage ? 'manage-items' : 'overview',
            )}
            onClick={handlePrimaryButtonClick}>
            {isManagedPricingPage || fromRegionalPricing
              ? translate('Action.AddItems')
              : translate('Action.GetStarted')}
          </NextLink>
        </Button>
      }
      secondary={
        <Button asChild variant='Utility' size='Medium'>
          <NextLink
            href={docs.getManagedPricingMonetizationUrl()}
            onClick={handleSecondaryButtonClick}>
            {translate('Description.LearnMore')}
          </NextLink>
        </Button>
      }
      illustration={{ src: promoBannerIllustrationLink }}
      onClose={handleDismissBanner}
      closeLabel={translate('Action.Dismiss')}
      className={className}
    />
  );
}

export default withTranslation(memo(ManagedPricingPromotionBanner), [
  TranslationNamespace.ManagedPricing,
]);
