import type { FunctionComponent, ReactNode } from 'react';
import { Icon, Link, VisuallyHidden, clsx } from '@rbx/foundation-ui';
import { useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import {
  AssetThumbnailSize,
  BundleThumbnailSize,
  ReturnPolicy,
  Thumbnail2d,
  ThumbnailTypes,
} from '@rbx/thumbnails';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type CollectibleItemTileType = 'asset' | 'bundle';
export type CollectibleItemLimitedType = 'limited' | 'limitedUnique';

export interface CollectibleItemTileProps {
  thumbnailTargetId: number;
  itemType: CollectibleItemTileType;
  name: string;
  creatorDisplayName?: string;
  price?: number | null;
  limitedType?: CollectibleItemLimitedType;
  href?: string;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

const INTERACTIVE_TILE_CLASS =
  'group/collectible-tile block min-width-0 width-full content-emphasis text-align-x-left padding-small margin-none stroke-none radius-medium cursor-pointer transition-colors focus-visible:outline-focus';
export const CollectibleItemTile: FunctionComponent<CollectibleItemTileProps> = ({
  thumbnailTargetId,
  itemType,
  name,
  creatorDisplayName,
  price,
  limitedType,
  href,
  onClick,
  isSelected = false,
  className,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { translate: translateCreations } = useTranslationWithNamespace(
    TranslationNamespace.Creations,
  );
  const isBundle = itemType === 'bundle';
  const creatorLabel = creatorDisplayName
    ? tPendingTranslation(
        'By {creatorName}',
        'Creator attribution shown below a collectible item name.',
        translationKey('Description.ByCreator', TranslationNamespace.AgreementsManager),
        { creatorName: creatorDisplayName },
      )
    : undefined;
  const limitedLabel = tPendingTranslation(
    'Limited',
    'Label indicating that an avatar marketplace item has a limited supply.',
    translationKey('Label.Limited', TranslationNamespace.AgreementsManager),
  );
  const limitedUniqueLabel = tPendingTranslation(
    'Limited Unique',
    'Label indicating that an avatar marketplace item has a limited supply and unique serial numbers.',
    translationKey('Label.LimitedUnique', TranslationNamespace.AgreementsManager),
  );

  let priceContent: ReactNode;
  if (price == null) {
    priceContent = translate('Label.Unknown');
  } else if (price === 0) {
    priceContent = translateCreations('Label.Free');
  } else {
    priceContent = (
      <span className='inline-flex items-center gap-xxsmall'>
        <Icon name='icon-filled-robux' size='XSmall' aria-hidden />
        <span>{String(price)}</span>
      </span>
    );
  }

  const content = (
    <div className='flex flex-col gap-xsmall min-width-0 width-full'>
      <div
        className={clsx(
          'relative width-full aspect-1-1 clip radius-medium bg-[transparent] transition-colors group-hover/collectible-tile:bg-shift-100',
          isSelected && 'bg-shift-200 group-hover/collectible-tile:bg-shift-200',
        )}>
        <Thumbnail2d
          alt={name}
          targetId={thumbnailTargetId}
          containerClass='absolute inset-[0] width-full height-full'
          imgClassName={clsx(
            'width-full height-full [object-fit:contain] transition-transform group-hover/collectible-tile:[transform:scale(1.05)]',
            isSelected && '[transform:scale(1.05)]',
          )}
          type={isBundle ? ThumbnailTypes.bundleThumbnail : ThumbnailTypes.assetThumbnail}
          // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
          size={isBundle ? BundleThumbnailSize._420x420 : AssetThumbnailSize._420x420}
          skeletonVariant='square'
          returnPolicy={ReturnPolicy.PlaceHolder}
        />
        {limitedType != null && (
          <span
            className={clsx(
              'absolute bottom-[var(--size-50)] left-[var(--size-50)] inline-block width-[123px] height-[18px] [background-image:url(/assets/limiteds/itemlabel_10182018.svg)] [background-repeat:no-repeat] [background-size:123px_450px]',
              limitedType === 'limited'
                ? '[background-position:0_-54px]'
                : '[background-position:0_-126px]',
            )}>
            <VisuallyHidden>
              {limitedType === 'limited' ? limitedLabel : limitedUniqueLabel}
            </VisuallyHidden>
          </span>
        )}
      </div>
      <div className='flex flex-col gap-xxsmall min-width-0'>
        <span
          className='text-title-large content-emphasis clip [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]'
          title={name}>
          {name}
        </span>
        {creatorLabel != null && (
          <span className='text-body-medium content-muted text-no-wrap text-truncate-end'>
            {creatorLabel}
          </span>
        )}
        <span className='text-body-medium content-emphasis'>{priceContent}</span>
      </div>
    </div>
  );

  if (href != null) {
    return (
      <Link
        className={clsx(
          'block min-width-0 width-full content-emphasis [text-decoration:none] hover:[text-decoration:none]',
          className,
        )}
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        isExternal={false}
        underline='none'
        onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (onClick != null) {
    return (
      <button
        type='button'
        aria-pressed={isSelected}
        data-ip-table-row-activatable
        className={clsx(
          INTERACTIVE_TILE_CLASS,
          isSelected ? '!bg-shift-100' : '!bg-[transparent]',
          className,
        )}
        onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

export default CollectibleItemTile;
