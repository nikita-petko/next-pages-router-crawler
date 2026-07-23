import { ReactNode } from 'react';

interface TwoLineTableCellContentProps {
  primary: ReactNode;
  secondary: ReactNode;
}

/** Stacks a primary value over a secondary subtext inside a table cell. */
const TwoLineTableCellContent = ({ primary, secondary }: TwoLineTableCellContentProps) => (
  <>
    <span className='text-body-medium'>{primary}</span>
    <span className='text-caption-small block'>{secondary}</span>
  </>
);

export default TwoLineTableCellContent;
