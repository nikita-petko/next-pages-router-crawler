import { IPContentContentTypeEnum, type IPContent } from '@rbx/client-rights/v1';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type TrademarkContentGridProps = {
  content: IPContent;
};

/**
 * TrademarkContentGrid displays trademark content in the claims/removal request table.
 */
const TrademarkContentGrid = ({ content }: TrademarkContentGridProps) => {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return (
      <ProgressCircle variant='Indeterminate' size='Small' ariaLabel={translate('Label.Loading')} />
    );
  }

  if (content.id === undefined) {
    return (
      <div className='flex flex-col justify-center min-width-0'>
        <span className='text-body-medium content-system-alert'>
          {translate('Label.CouldNotFetchCreation')}
        </span>
      </div>
    );
  }

  const isImageTrademark = content.contentType === IPContentContentTypeEnum.Asset;
  const trademarkName = isImageTrademark ? content.imageCaption : content.contentValue;

  return (
    <div className='flex flex-row items-center gap-medium min-width-0'>
      {isImageTrademark && (
        <div className='size-1000 shrink-0 radius-small clip'>
          <Thumbnail2d
            targetId={Number(content.contentValue)}
            type={ThumbnailTypes.assetThumbnail}
            alt={translate('Label.ContentPreview')}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
            containerClass='block'
          />
        </div>
      )}
      <div className='flex flex-col justify-center grow-1 basis-0 min-width-0'>
        {!!trademarkName && (
          <span className='block width-full clip [text-overflow:ellipsis] text-body-medium content-emphasis text-no-wrap'>
            {trademarkName}
          </span>
        )}
        {!trademarkName && (
          <span className='text-body-medium content-emphasis text-no-wrap'>
            {translate('Label.ID')}: {content.id}
          </span>
        )}
      </div>
    </div>
  );
};

export default withTranslation(TrademarkContentGrid, [TranslationNamespace.RightsPortal]);
