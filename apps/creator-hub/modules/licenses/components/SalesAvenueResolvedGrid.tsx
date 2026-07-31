import type { FunctionComponent } from 'react';
import type { SalesAvenueSelection } from '../utils/salesAvenue';
import SalesAvenueResolvedTile from './SalesAvenueResolvedTile';

interface SalesAvenueResolvedGridProps {
  entries: SalesAvenueSelection[];
}

/** Vertical list of read-only resolved sales-avenue rows for review surfaces. */
const SalesAvenueResolvedGrid: FunctionComponent<SalesAvenueResolvedGridProps> = ({ entries }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-small'>
      {entries.map((entry) => (
        <SalesAvenueResolvedTile key={`${entry.type}:${entry.id}`} entry={entry} />
      ))}
    </div>
  );
};

export default SalesAvenueResolvedGrid;
