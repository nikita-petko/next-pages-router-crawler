import { Button, Icon, IconButton, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { MAX_SHOWCASE_ITEMS } from '../constants';
import type { ShowcaseBackground, ShowcaseItem } from '../types';

type ShowcaseWidgetPreviewProps = {
  /** The widget's bolded title is the community name; the creator's text is the subtitle (FR-I2, FR-I3). */
  communityName: string;
  title: string;
  background: ShowcaseBackground;
  items: ShowcaseItem[];
  communityCoverPhotoUrl?: string;
};

/** Placeholder tiles keep the preview at a stable size before items are chosen. */
const PLACEHOLDER_TILE_COUNT = 4;

const ShowcaseWidgetPreview = ({
  communityName,
  title,
  background,
  items,
  communityCoverPhotoUrl,
}: ShowcaseWidgetPreviewProps) => {
  const { translate } = useTranslation();

  const visibleItems = items.slice(0, MAX_SHOWCASE_ITEMS);
  const placeholderCount = Math.max(0, PLACEHOLDER_TILE_COUNT - visibleItems.length);

  const useCoverPhoto =
    background === 'CommunityCoverPhoto' && communityCoverPhotoUrl !== undefined;

  return (
    <div className='flex flex-col gap-small'>
      <div className='flex items-center gap-xsmall'>
        <span className='text-title-medium content-emphasis'>
          {translate('Heading.ShowcaseWidgetPreview')}
        </span>
        <Tooltip position='top-center' title={translate('Description.ShowcaseWidgetPreview')}>
          <TooltipTrigger asChild>
            <span className='flex items-center content-muted'>
              <Icon name='icon-regular-circle-i' size='Small' />
            </span>
          </TooltipTrigger>
        </Tooltip>
      </div>

      <div
        aria-label={translate('Heading.ShowcaseWidgetPreview')}
        className='relative flex flex-col gap-small clip radius-medium padding-medium bg-shift-200'>
        {useCoverPhoto && (
          <img
            alt=''
            src={communityCoverPhotoUrl}
            className='absolute size-full [object-fit:cover]'
            style={{ inset: 0 }}
          />
        )}

        <div className='relative flex items-center gap-small'>
          <div className='size-[48px] radius-medium bg-shift-300' />
          <div className='flex grow-1 flex-col min-width-0'>
            <span className='text-title-medium content-emphasis text-truncate-end'>
              {communityName}
            </span>
            <span className='text-body-small content-muted text-truncate-end'>{title}</span>
          </div>
          <Button variant='Emphasis' size='Small' type='button' isDisabled>
            {translate('Action.ShopAll')}
          </Button>
          <IconButton
            variant='Standard'
            size='Small'
            ariaLabel={translate('Action.ShowcaseWidgetActions')}
            icon='icon-regular-three-dots-horizontal'
            isDisabled
          />
        </div>

        <div className='relative flex gap-small clip'>
          {visibleItems.map((item) => (
            <div key={item.assetId} className='flex flex-col gap-xxsmall width-[80px] shrink-0'>
              <div className='size-[80px] radius-small clip bg-shift-300'>
                <Thumbnail2d
                  alt={item.name}
                  returnPolicy={ReturnPolicy.PlaceHolder}
                  targetId={item.assetId}
                  type={ThumbnailTypes.assetThumbnail}
                />
              </div>
              <span className='text-label-small content-emphasis text-truncate-end'>
                {item.name}
              </span>
            </div>
          ))}
          {Array.from({ length: placeholderCount }, (_, index) => (
            <div
              aria-hidden
              key={`placeholder-${index}`}
              className='size-[80px] radius-small bg-shift-300 shrink-0'
              data-testid='showcase-preview-placeholder'
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShowcaseWidgetPreview;
