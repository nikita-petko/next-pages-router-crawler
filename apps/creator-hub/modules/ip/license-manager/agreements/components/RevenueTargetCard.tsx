import type { FunctionComponent } from 'react';
import type { RevenueTargetResponse } from '@rbx/client-content-licensing-api/v1';
import { RevenueTargetType } from '@rbx/client-content-licensing-api/v1';
import { Icon } from '@rbx/foundation-ui';
import { Locale, useLocalization } from '@rbx/intl';
import { AssetThumbnailSize, Thumbnail2d } from '@rbx/thumbnails';
import {
  getSalesAvenueThumbnailTarget,
  type SalesAvenueSelection,
} from '@modules/licenses/utils/salesAvenue';

export type SupportedRevenueTargetType =
  | typeof RevenueTargetType.DeveloperProduct
  | typeof RevenueTargetType.GamePass;

export type DisplayableRevenueTarget = RevenueTargetResponse & {
  revenueTargetId: string;
  revenueTargetType: SupportedRevenueTargetType;
};

// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const REVENUE_TARGET_THUMBNAIL_SIZE = AssetThumbnailSize._150x150;

export const isDisplayableRevenueTarget = (
  revenueTarget: RevenueTargetResponse,
): revenueTarget is DisplayableRevenueTarget => {
  const { revenueTargetId, revenueTargetType } = revenueTarget;

  return (
    typeof revenueTargetId === 'string' &&
    revenueTargetId.length > 0 &&
    (revenueTargetType === RevenueTargetType.DeveloperProduct ||
      revenueTargetType === RevenueTargetType.GamePass)
  );
};

interface RevenueTargetCardProps {
  revenueTarget: SalesAvenueSelection;
}

/**
 * Displays a revenue target using the square thumbnail-and-caption treatment from the
 * Experience Details Store tab.
 */
const RevenueTargetCard: FunctionComponent<RevenueTargetCardProps> = ({ revenueTarget }) => {
  const { locale } = useLocalization();
  const thumbnail = getSalesAvenueThumbnailTarget(revenueTarget);
  const formattedPrice = new Intl.NumberFormat(locale ?? Locale.English).format(
    revenueTarget.priceInRobux,
  );

  return (
    <article className='flex width-[110px] min-width-0 flex-col items-center gap-small'>
      <div className='size-[110px] shrink-0 clip radius-circle bg-shift-100'>
        <Thumbnail2d
          key={`${thumbnail.type}-${thumbnail.targetId}`}
          alt={revenueTarget.name}
          targetId={thumbnail.targetId}
          type={thumbnail.type}
          size={REVENUE_TARGET_THUMBNAIL_SIZE}
          skeletonVariant='square'
          containerClass='block height-full width-full'
        />
      </div>
      <span
        className='width-full text-align-x-center text-label-medium text-no-wrap text-truncate-end'
        title={revenueTarget.name}>
        {revenueTarget.name}
      </span>
      <span className='inline-flex items-center justify-center gap-x-xsmall text-body-medium'>
        <Icon name='icon-filled-robux' size='Small' />
        <span>{formattedPrice}</span>
      </span>
    </article>
  );
};

export default RevenueTargetCard;
