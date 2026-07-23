import { TableCell, type TTableCellAlign } from '@rbx/foundation-ui';

import Creative from '@components/common/Creative';
import EntityIdTooltip from '@components/reporting/EntityIdTooltip';
import useTableCreativeCellStyles from '@components/reporting/TableCreativeCell.styles';
import { defaultAlign } from '@constants/genericManagementTableStyles';

const TableCreativeCell = ({
  align = defaultAlign,
  assetId,
  className,
  copyToClipboardContent,
}: {
  align: TTableCellAlign;
  assetId?: number;
  className?: string;
  copyToClipboardContent: string;
}) => {
  const {
    classes: { creative },
  } = useTableCreativeCellStyles();

  // For tooltip to show on creative button, must wrap in a div
  return (
    <TableCell align={align} className={className}>
      <EntityIdTooltip copyToClipboardContent={copyToClipboardContent}>
        <div>
          {assetId !== undefined && <Creative assetId={assetId} className={creative} showPreview />}
        </div>
      </EntityIdTooltip>
    </TableCell>
  );
};

export default TableCreativeCell;
