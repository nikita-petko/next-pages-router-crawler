import type { FunctionComponent } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d } from '@rbx/thumbnails';
import {
  getSalesAvenueThumbnailSize,
  getSalesAvenueThumbnailTarget,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';
import SalesAvenueResolvedEntry from './SalesAvenueResolvedEntry';
import useSalesAvenueTextFieldStyles from './SalesAvenueTextField.styles';

interface SalesAvenueResolvedListItemProps {
  entry: SalesAvenueSelection;
  onClear: () => void;
}

/** Resolved sales-avenue row with remove affordance for multi-entry collaboration forms. */
const SalesAvenueResolvedListItem: FunctionComponent<SalesAvenueResolvedListItemProps> = ({
  entry,
  onClear,
}) => {
  const { translate } = useTranslation();
  const { classes } = useSalesAvenueTextFieldStyles();
  const thumbnail = getSalesAvenueThumbnailTarget(entry);
  const thumbnailSize = getSalesAvenueThumbnailSize(entry);

  return (
    <div className={classes.resolvedListItemRoot} data-testid='sales-avenue-resolved'>
      <div className={classes.thumbnailContainer}>
        <Thumbnail2d
          key={`${thumbnail.type}-${thumbnail.targetId}`}
          alt={entry.name}
          targetId={thumbnail.targetId}
          size={thumbnailSize}
          skeletonVariant='square'
          containerClass={classes.thumbnailContainer}
          type={thumbnail.type}
        />
      </div>
      <SalesAvenueResolvedEntry entry={entry} />
      <div className={classes.resolvedListItemRemoveButton}>
        <IconButton
          variant='Utility'
          size='Medium'
          icon='icon-regular-trash-can'
          ariaLabel={translate('Action.Delete')}
          onClick={onClear}
        />
      </div>
    </div>
  );
};

export default SalesAvenueResolvedListItem;
