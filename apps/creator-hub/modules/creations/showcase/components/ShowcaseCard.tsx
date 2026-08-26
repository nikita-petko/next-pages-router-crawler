import { useMemo } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { MAX_LIST_CARD_THUMBNAILS } from '../constants';
import type { Showcase } from '../types';

type ShowcaseCardProps = {
  showcase: Showcase;
  onManage?: () => void;
};

/**
 * The list card intentionally shows at most three thumbnails regardless of item
 * count, so the metadata line is the only place the true count appears.
 */
const ShowcaseCard = ({ showcase, onManage }: ShowcaseCardProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  // Format against the creator's selected language rather than the runtime default.
  const publishedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale ?? Locale.English, { dateStyle: 'medium' }).format(
        new Date(showcase.publishedAt),
      ),
    [locale, showcase.publishedAt],
  );

  const metadata = translate('Label.ShowcaseCardMetadata', {
    itemCount: String(showcase.items.length),
    publishedDate,
  });

  return (
    <div className='flex flex-col gap-medium padding-medium radius-medium stroke-standard stroke-default'>
      <div className='flex items-start gap-small'>
        <div className='flex grow-1 flex-col gap-xxsmall min-width-0'>
          <div className='flex items-center gap-small'>
            <span className='text-title-medium content-emphasis text-truncate-end'>
              {showcase.title}
            </span>
            {showcase.moderationStatus === 'Moderated' && (
              <Badge label={translate('Label.Moderated')} variant='Alert' />
            )}
          </div>
          <span className='text-body-small content-muted'>{metadata}</span>
        </div>
        {onManage !== undefined && (
          <Popover>
            <PopoverTrigger asChild>
              <IconButton
                variant='Standard'
                size='Small'
                ariaLabel={translate('Action.ShowcaseActions')}
                icon='icon-regular-three-dots-horizontal'
              />
            </PopoverTrigger>
            <PopoverContent align='end' ariaLabel={translate('Action.ShowcaseActions')}>
              <Menu size='Medium'>
                <MenuItem
                  value='manage'
                  title={translate('Heading.ManageShowcase')}
                  onSelect={onManage}
                />
              </Menu>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className='flex gap-small'>
        {showcase.items.slice(0, MAX_LIST_CARD_THUMBNAILS).map((item) => (
          <Thumbnail2d
            key={item.assetId}
            targetId={item.assetId}
            type={ThumbnailTypes.assetThumbnail}
            skeletonVariant='square'
            alt={item.name}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
          />
        ))}
      </div>
    </div>
  );
};

export default ShowcaseCard;
