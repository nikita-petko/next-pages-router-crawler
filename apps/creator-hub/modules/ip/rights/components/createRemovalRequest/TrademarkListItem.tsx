import { IPContentContentTypeEnum, type IPContent } from '@rbx/client-rights/v1';
import { IconButton, Radio } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type TrademarkListItemProps = {
  trademark: IPContent;
} & (
  | {
      variant: 'selecting';
    }
  | {
      variant: 'selected';
      onRemove: () => void;
    }
);

/**
 * TrademarkListItem displays a single trademark in the trademark picker side sheet
 */
const TrademarkListItem = (props: TrademarkListItemProps) => {
  const { trademark, variant } = props;
  const { translate } = useTranslation();

  const isText = trademark.contentType === IPContentContentTypeEnum.Text;
  const name = isText ? (trademark.contentValue ?? '') : (trademark.imageCaption ?? '');

  return (
    <div
      className={`flex flex-row items-center gap-medium padding-y-small min-width-0 ${
        variant === 'selected' ? 'width-fit' : 'width-full'
      }`}>
      {!isText && (
        <div className='size-1500 shrink-0 radius-small clip'>
          <Thumbnail2d
            targetId={parseInt(trademark.contentValue ?? '', 10)}
            type={ThumbnailTypes.assetThumbnail}
            alt={name}
            returnPolicy={ReturnPolicy.PlaceHolder}
            containerClass='block'
            // eslint-disable-next-line no-underscore-dangle -- external enum
            size={AssetThumbnailSize._150x150}
          />
        </div>
      )}
      <span className='grow-1 basis-0 min-width-0 text-wrap [overflow-wrap:anywhere] text-title-medium content-emphasis'>
        {name}
      </span>
      {variant === 'selecting' ? (
        <div className='shrink-0'>
          <Radio value={trademark.id ?? ''} aria-label={name} size='Medium' placement='End' />
        </div>
      ) : (
        <div className='shrink-0'>
          <IconButton
            variant='Utility'
            size='Medium'
            icon='icon-regular-trash-can'
            ariaLabel={translate('Action.Delete')}
            onClick={props.onRemove}
          />
        </div>
      )}
    </div>
  );
};

export default withTranslation(TrademarkListItem, [TranslationNamespace.RightsPortal]);
