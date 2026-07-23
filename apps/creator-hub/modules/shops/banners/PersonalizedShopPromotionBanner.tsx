import { memo, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard, docs } from '@modules/miscellaneous/urls/creatorHub';
import PromotionBanner from '@modules/monetization-shared/promotion-banner/PromotionBanner';
import { TAB_QUERY_KEY } from '@modules/monetization-shared/tabs/useTabs';
import { usePersonalizedShopPromotionBanner } from './usePersonalizedShopPromotionBanner';

const LEARN_MORE_HREF = docs.getPersonalizedShopsMonetizationUrl();
const ITEM_CATALOG_TAB = 'item-catalog';

const getItemCatalogHref = (universeId: number) =>
  `${dashboard.getPersonalizedShopsUrl(universeId)}?${TAB_QUERY_KEY}=${ITEM_CATALOG_TAB}` as const;

const promoBannerIllustrationLink = `${process.env.assetPathPrefix}/shops/promo-banner-illustration.webp`;

function PersonalizedShopPromotionBanner({
  universeId,
  className,
}: {
  universeId: number;
  className?: string;
}) {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { isOpen, close } = usePersonalizedShopPromotionBanner(universeId);

  const handleReviewItems = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/PersonalizedShopPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        action: 'primary',
      },
    });
  }, [unifiedLogger, universeId]);

  const handleLearnMore = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/PersonalizedShopPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        action: 'secondary',
      },
    });
  }, [unifiedLogger, universeId]);

  const handleDismissBanner = useCallback(() => {
    close();
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/PersonalizedShopPromotionBannerClick',
      parameters: {
        universe_id: universeId.toString(),
        action: 'dismiss',
      },
    });
  }, [close, unifiedLogger, universeId]);

  const bannerRef = useRef<HTMLDivElement>(null);

  const sendImpressionEvent = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/banner/PersonalizedShopPromotionBannerImpression',
      parameters: {
        universe_id: universeId.toString(),
      },
    });
  }, [unifiedLogger, universeId]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  if (!isOpen) {
    return null;
  }

  return (
    <PromotionBanner
      ref={bannerRef}
      title={translate('Heading.PersonalizedShopPromotionBanner')}
      description={translate('Description.PersonalizedShopPromotionBanner')}
      primary={
        <Button asChild variant='Emphasis' size='Medium'>
          <NextLink href={getItemCatalogHref(universeId)} onClick={handleReviewItems}>
            {translate('Action.ReviewItems')}
          </NextLink>
        </Button>
      }
      secondary={
        <Button asChild variant='Utility' size='Medium'>
          <NextLink href={LEARN_MORE_HREF} target='_blank' onClick={handleLearnMore}>
            {translate('Action.LearnMore')}
          </NextLink>
        </Button>
      }
      onClose={handleDismissBanner}
      closeLabel={translate('Action.Close')}
      illustration={{ src: promoBannerIllustrationLink }}
      className={className}
    />
  );
}

export default withTranslation(memo(PersonalizedShopPromotionBanner), [
  TranslationNamespace.PersonalizedShop,
]);
