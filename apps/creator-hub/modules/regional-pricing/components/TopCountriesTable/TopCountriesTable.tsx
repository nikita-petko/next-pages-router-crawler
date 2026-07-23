import { useMemo } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Icon, clsx } from '@rbx/foundation-ui';
import TopCountriesTableRow from './TopCountriesTableRow';
import { RegionalPriceDisplayInfo } from '../../types';

type Props = {
  onViewAllCountries: () => void;
  disableViewAllCountries: boolean;
  topCountriesData: RegionalPriceDisplayInfo[];
  isForSale: boolean;
  className?: string;
};

function TopCountriesTable({
  onViewAllCountries,
  disableViewAllCountries,
  topCountriesData,
  isForSale,
  className,
}: Props) {
  const { translate } = useTranslation();

  const tableRows = useMemo(
    () =>
      topCountriesData.map(({ country, displayPrice }) => (
        <TopCountriesTableRow key={country} country={country} displayPrice={displayPrice} />
      )),
    [topCountriesData],
  );

  return (
    <TableContainer className={clsx('max-width-[678px]', isForSale || '[opacity: 0.5]', className)}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className='padding-y-medium padding-x-large'>
              <span className='text-caption-large'>
                {translate('Heading.TopCountriesTableExperienceTopCountries')}
              </span>
            </TableCell>
            <TableCell className='padding-y-medium padding-x-large'>
              <span className='text-caption-large flex items-center gap-xsmall justify-end'>
                {translate('Heading.TopCountriesTableRegionalPrice')}
                <Tooltip
                  title={translate('Tooltip.TopCountriesTableRegionalPrice')}
                  placement='right'
                  arrow>
                  <Icon name='icon-regular-circle-i' size='Small' />
                </Tooltip>
              </span>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows}
          <TableRow>
            <TableCell colSpan={2} className='padding-y-small padding-x-none'>
              <Button
                className='text-caption-large'
                onClick={onViewAllCountries}
                disabled={disableViewAllCountries}>
                {translate('Label.TopCountriesTableViewAllCountries')}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default withTranslation(TopCountriesTable, [TranslationNamespace.RegionalPricing]);
