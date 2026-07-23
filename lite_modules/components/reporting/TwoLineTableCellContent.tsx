import { Typography } from '@rbx/ui';
import { ReactNode } from 'react';

interface TwoLineTableCellContentProps {
  primary: ReactNode;
  secondary: ReactNode;
}

/** Stacks a primary value over a secondary subtext inside a table cell. */
const TwoLineTableCellContent = ({ primary, secondary }: TwoLineTableCellContentProps) => (
  <>
    <Typography variant='body2'>{primary}</Typography>
    <Typography className='block' variant='captionSmall'>
      {secondary}
    </Typography>
  </>
);

export default TwoLineTableCellContent;
