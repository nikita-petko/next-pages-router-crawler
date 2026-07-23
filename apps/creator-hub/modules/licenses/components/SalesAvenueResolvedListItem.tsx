import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, AssetThumbnailSize } from '@rbx/thumbnails';
import { CancelIcon } from '@rbx/ui';
import { getSalesAvenueThumbnailTarget, type SalesAvenueSelection } from '../utils/salesAvenue';
import SalesAvenueResolvedEntry from './SalesAvenueResolvedEntry';
import useSalesAvenueTextFieldStyles, {
  foundationInputRootClass,
} from './SalesAvenueTextField.styles';

// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const ASSET_THUMBNAIL_SIZE = AssetThumbnailSize._50x50;

interface SalesAvenueResolvedListItemProps {
  entry: SalesAvenueSelection;
  onClear: () => void;
}

/** Resolved sales-avenue row with clear affordance for multi-entry collaboration forms. */
const SalesAvenueResolvedListItem: FunctionComponent<SalesAvenueResolvedListItemProps> = ({
  entry,
  onClear,
}) => {
  const { translate } = useTranslation();
  const { classes } = useSalesAvenueTextFieldStyles();

  const productTypeLabel =
    entry.type === 'GamePass' ? translate('Label.GamePass') : translate('Label.DeveloperProduct');
  const idLabel = translate('Label.IdWithInput', { assetId: String(entry.id) });
  const thumbnail = getSalesAvenueThumbnailTarget(entry);

  return (
    <div className={classes.fieldShell}>
      <div
        className={`${classes.resolvedRoot} ${foundationInputRootClass(false)}`}
        data-testid='sales-avenue-resolved'>
        <div className={classes.thumbnailContainer}>
          <Thumbnail2d
            key={`${thumbnail.type}-${thumbnail.targetId}`}
            alt={entry.name}
            targetId={thumbnail.targetId}
            size={ASSET_THUMBNAIL_SIZE}
            skeletonVariant='square'
            containerClass={classes.thumbnailContainer}
            type={thumbnail.type}
          />
        </div>
        <SalesAvenueResolvedEntry
          entry={entry}
          productTypeLabel={productTypeLabel}
          idLabel={idLabel}
        />
      </div>
      <div className={classes.clearButtonAbsolute}>
        <CancelIcon fontSize='small' onClick={onClear} className={classes.clearIcon} />
      </div>
    </div>
  );
};

export default SalesAvenueResolvedListItem;
