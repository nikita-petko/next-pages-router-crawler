import { TableCell, TableRow } from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';

type Props = {
  country: string;
  displayPrice: string;
};

function TopCountriesTableRow({ country, displayPrice }: Props) {
  return (
    <TableRow>
      <TableCell className='text-body-medium padding-y-medium padding-x-large'>{country}</TableCell>
      <TableCell className='text-body-medium padding-y-medium padding-x-large'>
        <span className='flex items-center gap-xsmall justify-end'>
          <Icon name='icon-filled-robux' size='Small' />
          {displayPrice}
        </span>
      </TableCell>
    </TableRow>
  );
}

export default TopCountriesTableRow;
