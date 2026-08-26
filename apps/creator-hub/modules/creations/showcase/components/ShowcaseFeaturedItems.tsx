import {
  Icon,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { RobuxIcon } from '@rbx/ui';
import { MAX_SHOWCASE_ITEMS } from '../constants';
import type { ShowcaseItem } from '../types';

type ShowcaseFeaturedItemsProps = {
  items: ShowcaseItem[];
  onAddItem?: () => void;
  onBringToFront?: (assetId: number) => void;
  onSendToBack?: (assetId: number) => void;
  onRemove?: (assetId: number) => void;
  /**
   * Manage renders the items of a published showcase, which is immutable (FR-C3):
   * no add tile, no per-tile actions, and no remaining-capacity count.
   */
  isReadOnly?: boolean;
};

const ShowcaseFeaturedItems = ({
  items,
  onAddItem,
  onBringToFront,
  onSendToBack,
  onRemove,
  isReadOnly = false,
}: ShowcaseFeaturedItemsProps) => {
  const { translate } = useTranslation();
  const canReorder = !isReadOnly && onBringToFront !== undefined && onSendToBack !== undefined;

  return (
    <div className='flex flex-col gap-small self-stretch' data-testid='showcase-featured-items'>
      <div className='flex flex-col gap-xxsmall'>
        <span className='text-heading-small content-emphasis'>
          {isReadOnly
            ? translate('Label.ShowcaseFeaturedItems')
            : translate('Heading.ShowcaseFeaturedItems', {
                itemCount: String(items.length),
                maxItems: String(MAX_SHOWCASE_ITEMS),
              })}
        </span>
        {!isReadOnly && (
          <span className='text-body-small content-muted'>
            {translate('Description.ShowcaseFeaturedItems')}
          </span>
        )}
      </div>

      <div className='flex wrap gap-medium'>
        {!isReadOnly && onAddItem !== undefined && (
          <button
            type='button'
            aria-label={translate('Action.AddShowcaseItem')}
            disabled={items.length >= MAX_SHOWCASE_ITEMS}
            onClick={onAddItem}
            className='flex flex-col items-center justify-center gap-small size-[88px] radius-medium bg-shift-200 content-muted'>
            <Icon name='icon-filled-plus-large' size='Medium' />
          </button>
        )}

        {items.map((item) => (
          <div key={item.assetId} className='relative flex flex-col gap-xsmall width-[88px]'>
            <div className='radius-medium clip size-[88px] bg-shift-200'>
              <Thumbnail2d
                alt={item.name}
                returnPolicy={ReturnPolicy.PlaceHolder}
                targetId={item.assetId}
                type={ThumbnailTypes.assetThumbnail}
              />
            </div>
            <span className='text-label-small content-emphasis text-truncate-end'>{item.name}</span>
            {item.price !== null && (
              <span className='flex items-center gap-xxsmall text-label-small content-emphasis'>
                <RobuxIcon fontSize='small' />
                {item.price}
              </span>
            )}
            {canReorder && (
              <div className='absolute' style={{ top: 4, right: 4 }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <IconButton
                      variant='Standard'
                      size='Small'
                      ariaLabel={translate('Action.ShowcaseItemActions')}
                      icon='icon-regular-three-dots-horizontal'
                    />
                  </PopoverTrigger>
                  <PopoverContent align='end' ariaLabel={translate('Action.ShowcaseItemActions')}>
                    <Menu size='Medium'>
                      <MenuItem
                        value='bring-to-front'
                        title={translate('Action.BringToFront')}
                        onSelect={() => onBringToFront?.(item.assetId)}
                      />
                      <MenuItem
                        value='send-to-back'
                        title={translate('Action.SendToBack')}
                        onSelect={() => onSendToBack?.(item.assetId)}
                      />
                      <MenuItem
                        value='remove'
                        title={translate('Action.Remove')}
                        className='content-system-alert'
                        onSelect={() => onRemove?.(item.assetId)}
                      />
                    </Menu>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowcaseFeaturedItems;
