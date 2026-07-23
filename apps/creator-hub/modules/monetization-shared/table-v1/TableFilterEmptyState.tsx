import { memo } from 'react';
import { TableRow, TableCell } from '@rbx/ui';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { useTranslation } from '@rbx/intl';

/**
 * Column span larger than column count - used to span entire table body.
 * May have weird effects on fixed table layout - use with caution.
 */
export const TABLE_BODY_FULL_COL_SPAN = 100;

/**
 * Generic empty state for search / filter views.
 */
function TableFilterEmptyState() {
  const { translate } = useTranslation();
  return (
    <TableRow>
      <TableCell
        colSpan={TABLE_BODY_FULL_COL_SPAN}
        className='items-center min-height-[320px] padding-y-[96px] [vertical-align:middle]'>
        {/* TODO: migrate to foundation-based empty state */}
        <EmptyState
          title={translate('Heading.NoMatchingItems' /* TranslationNamespace.Creations */)}
          description={translate(
            'Description.NoMatchingItems' /* TranslationNamespace.Creations */,
          )}
          size='small'
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(TableFilterEmptyState);
