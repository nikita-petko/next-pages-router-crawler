import { TableCell, type TTableCellAlign } from '@rbx/foundation-ui';
import { ReactNode } from 'react';

import StatusLabel from '@components/reporting/StatusLabel';
import useTableStatusCellStyles from '@components/reporting/TableStatusCell.styles';
import { StatusText } from '@constants/campaignStatus';

const TableStatusCell = ({
  align,
  className,
  status,
  tooltipContent,
}: {
  align: TTableCellAlign;
  className: string;
  status: StatusText;
  tooltipContent: ReactNode;
}) => {
  const {
    classes: { statusCellContent },
    cx,
  } = useTableStatusCellStyles({ status });
  return (
    <TableCell align={align} className={cx([statusCellContent, className])}>
      <StatusLabel status={status} tooltipContent={tooltipContent} />
    </TableCell>
  );
};

export default TableStatusCell;
