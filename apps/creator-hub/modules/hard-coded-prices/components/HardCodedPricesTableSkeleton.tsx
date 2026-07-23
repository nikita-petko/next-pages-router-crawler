import { Skeleton, TableCell, TableRow } from '@rbx/ui';
import HardCodedPricesTableBase from './HardCodedPricesTableBase';
import StudioLauncherButton from './StudioLauncherButton';

const DEFAULT_ROW_COUNT = 10;

function SkeletonRow() {
  return (
    <TableRow>
      {/* File Name (avatar + path) */}
      <TableCell>
        <div className='flex items-center gap-small'>
          <Skeleton animate variant='rectangular' width={40} height={40} />
          <Skeleton animate variant='text' width={280} height={16} />
        </div>
      </TableCell>

      {/* Line Item */}
      <TableCell>
        <Skeleton animate variant='text' width={32} height={16} />
      </TableCell>

      {/* Code snippet */}
      <TableCell>
        <Skeleton animate variant='rectangular' width={280} height={32} />
      </TableCell>

      {/* Studio Launcher */}
      <TableCell>
        <StudioLauncherButton disabled />
      </TableCell>

      {/* Dismiss / More Actions */}
      <TableCell padding='checkbox' align='center' />
    </TableRow>
  );
}

function HardCodedPricesTableSkeleton({ rowCount = DEFAULT_ROW_COUNT }: { rowCount?: number }) {
  return (
    <section className='margin-bottom-large'>
      <HardCodedPricesTableBase disableSort>
        {Array.from({ length: rowCount }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
      </HardCodedPricesTableBase>
    </section>
  );
}

export default HardCodedPricesTableSkeleton;
