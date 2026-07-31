import type { FunctionComponent } from 'react';
import { RobuxIcon, Typography } from '@rbx/ui';
import type { SalesAvenueSelection } from '../utils/salesAvenue';

interface SalesAvenueResolvedEntryProps {
  entry: SalesAvenueSelection;
}

const SalesAvenueResolvedEntry: FunctionComponent<SalesAvenueResolvedEntryProps> = ({ entry }) => {
  return (
    <div className='flex min-width-0 grow flex-col justify-center gap-y-xxsmall clip'>
      <Typography variant='body2' noWrap className='margin-y-none'>
        {entry.name}
      </Typography>
      <Typography
        variant='caption'
        component='div'
        noWrap
        className='margin-y-none flex items-center gap-x-xsmall content-muted'>
        <RobuxIcon fontSize='small' className='shrink-0' />
        <span>{entry.priceInRobux.toLocaleString()}</span>
      </Typography>
    </div>
  );
};

export default SalesAvenueResolvedEntry;
