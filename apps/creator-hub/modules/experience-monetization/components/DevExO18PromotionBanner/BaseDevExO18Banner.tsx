import { memo, useCallback, useRef } from 'react';
import NextLink from 'next/link';
import { Button, clsx, type TButtonVariant } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import PromotionBanner from '@modules/monetization-shared/promotion-banner/PromotionBanner';
import DevExO18BannerIllustrationTooltip from './DevExO18BannerIllustrationTooltip';

type DevExO18BannerAction = {
  label: string;
  href?: string;
  isExternal?: boolean;
};

type BaseDevExO18BannerProps = {
  universeId: number;
  title: string;
  description: string;
  primary: DevExO18BannerAction;
  secondary?: DevExO18BannerAction;
  illustrationSrc: string;
  bannerType: 'Upsell' | 'Eligible';
  onClose: () => void;
  className?: string;
};

function BaseDevExO18Banner({
  universeId,
  title,
  description,
  primary,
  secondary,
  illustrationSrc,
  bannerType,
  onClose,
  className,
}: BaseDevExO18BannerProps) {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const logClick = useCallback(
    (action: 'primary' | 'secondary' | 'dismiss') => {
      unifiedLogger.logClickEvent({
        eventName: 'analytics/banner/DevExO18PromotionBannerClick',
        parameters: {
          universe_id: universeId.toString(),
          banner_type: bannerType,
          action,
        },
      });
    },
    [bannerType, unifiedLogger, universeId],
  );

  const handleDismissBanner = useCallback(() => {
    onClose();
    logClick('dismiss');
  }, [logClick, onClose]);

  const bannerRef = useRef<HTMLDivElement>(null);

  const sendImpressionEvent = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/banner/DevExO18PromotionBannerImpression',
      parameters: {
        universe_id: universeId.toString(),
        banner_type: bannerType,
      },
    });
  }, [bannerType, unifiedLogger, universeId]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  const renderAction = (action: DevExO18BannerAction, actionType: 'primary' | 'secondary') => {
    // Product decision: rendering these as non-emphasis as there's no strict actionable benefit with CTA
    const buttonVariant: TButtonVariant = actionType === 'primary' ? 'Standard' : 'ActionUtility';
    if (!action.href) {
      return (
        <Button variant={buttonVariant} size='Medium' onClick={() => logClick(actionType)}>
          {action.label}
        </Button>
      );
    }

    return (
      <Button asChild variant={buttonVariant} size='Medium' onClick={() => logClick(actionType)}>
        <NextLink
          href={action.href}
          target={action.isExternal ? '_blank' : undefined}
          rel={action.isExternal ? 'noopener noreferrer' : undefined}>
          {action.label}
        </NextLink>
      </Button>
    );
  };

  // Wrap PromotionBanner in our own relative container so the static
  // illustration tooltip can be overlaid relative to it without modifying the
  // shared PromotionBanner. External className (layout/margins) goes on the
  // wrapper; PromotionBanner fills it.
  return (
    <div className={clsx('relative', className)}>
      <PromotionBanner
        ref={bannerRef}
        title={title}
        description={description}
        primary={renderAction(primary, 'primary')}
        secondary={secondary ? renderAction(secondary, 'secondary') : undefined}
        illustration={{ src: illustrationSrc }}
        onClose={handleDismissBanner}
        closeLabel={translate('Action.DismissDevExO18Banner' /* TranslationNamespace.DevEx */)}
      />
      <DevExO18BannerIllustrationTooltip universeId={universeId} />
    </div>
  );
}

export default withTranslation(memo(BaseDevExO18Banner), [TranslationNamespace.DevEx]);
