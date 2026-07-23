import { memo, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { Banner, type TBannerProps } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useImpressionObserver } from '@modules/charts-generic';
import { docs } from '@modules/miscellaneous/common/urls/creatorHub';
import type { UseRegionalPricingPromotionBannerParams } from '../../hooks/useRegionalPricingPromotionBanner';
import usePromotionBannerStyles from './BaseRegionalPricingPromotionBanner.styles';

type BaseRegionalPricingPromotionBannerProps = {
  universeId: number;
  /** Primary action button of the banner */
  primary: TBannerProps['primary'];
  /** Page / view associated with current banner */
  page: UseRegionalPricingPromotionBannerParams['page'];
  isOpen: boolean;
  onClose: () => void;
  /** Additional class names for styling */
  className?: string;
};

const promoBannerIllustrationLink = `${process.env.assetPathPrefix}/regional-pricing/promo-banner-illustration.png`;
const regionalPricingDocumentationLink = docs.getRegionalPricingMonetizationUrl();

const BaseRegionalPricingPromotionBanner = ({
  universeId,
  page,
  primary,
  isOpen,
  onClose,
  className,
}: BaseRegionalPricingPromotionBannerProps) => {
  const { translate } = useTranslation();
  const { classes, cx } = usePromotionBannerStyles();

  const { unifiedLogger } = useUnifiedLoggerProvider();

  const handlePrimaryButtonClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/RegionalPricingPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        page,
        action: 'primary',
      },
    });
  }, [page, unifiedLogger, universeId]);

  const handleSecondaryButtonClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/RegionalPricingPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        page,
        action: 'secondary',
      },
    });
  }, [page, unifiedLogger, universeId]);

  const handleDismissBanner = useCallback(() => {
    onClose();
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/RegionalPricingPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        page,
        action: 'dismiss',
      },
    });
  }, [page, unifiedLogger, universeId, onClose]);

  const bannerRef = useRef<HTMLDivElement>(null);

  const sendImpressionEvent = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/banner/RegionalPricingPromotionBannerImpression',
      parameters: {
        universe_id: universeId.toString(),
        page,
      },
    });
  }, [page, unifiedLogger, universeId]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  if (!isOpen) {
    return null;
  }

  return (
    <Banner
      ref={bannerRef}
      title={translate('Heading.PromotionBanner')}
      description={translate('Description.PromotionBanner')}
      primary={{
        ...primary,
        onClick: (e) => {
          primary.onClick?.(e);
          handlePrimaryButtonClick();
        },
      }}
      secondary={{
        label: translate('Description.LearnMore'),
        component: NextLink,
        href: regionalPricingDocumentationLink,
        onClick: handleSecondaryButtonClick,
      }}
      illustration={{ src: promoBannerIllustrationLink, alt: '' }}
      onClose={handleDismissBanner}
      classes={{ root: cx(classes.banner, className) }}
    />
  );
};

export default withTranslation(memo(BaseRegionalPricingPromotionBanner), [
  TranslationNamespace.RegionalPricing,
]);
