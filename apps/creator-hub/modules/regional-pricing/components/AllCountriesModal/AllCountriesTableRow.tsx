import { memo } from 'react';
import { TableCell, TableRow } from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';

type Props = {
  country: string;
  displayPrices: string[];
};

function AllCountriesTableRow({ country, displayPrices }: Props) {
  return (
    <TableRow>
      <TableCell className='text-body-large'>{country}</TableCell>
      {displayPrices.map((displayPrice, index) => (
        // eslint-disable-next-line react/no-array-index-key -- using index as key is not ideal but acceptable here
        <TableCell key={`${country}-${displayPrice}-${index}`} className='text-body-large'>
          <span className='flex items-center gap-xsmall justify-end'>
            <Icon name='icon-filled-robux' size='Small' />
            {displayPrice}
          </span>
        </TableCell>
      ))}
    </TableRow>
  );
}

export default memo(AllCountriesTableRow);
