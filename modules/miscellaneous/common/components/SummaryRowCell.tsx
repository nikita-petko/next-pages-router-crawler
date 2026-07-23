import { TableCell, TTableCellProps } from '@rbx/ui';

type SummaryRowCellProps = TTableCellProps;

const SummaryRowCell = (props: SummaryRowCellProps) => (
  // @ts-ignore
  <TableCell style={{ padding: '8px 16px' }} {...props} />
);

export default SummaryRowCell;
