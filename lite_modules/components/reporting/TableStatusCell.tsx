import { TableCell, type TTableCellAlign } from '@rbx/foundation-ui';
import { ReactNode } from 'react';

import StatusLabel from '@components/reporting/StatusLabel';
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
}) => (
  <TableCell align={align} className={`min-width-[110px] ${className}`}>
    <StatusLabel status={status} tooltipContent={tooltipContent} />
  </TableCell>
);

export default TableStatusCell;
