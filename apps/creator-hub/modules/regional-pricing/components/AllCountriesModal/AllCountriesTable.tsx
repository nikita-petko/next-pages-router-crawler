import { useMemo } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AllCountriesDisplayInfo } from '../../types';
import AllCountriesTableRow from './AllCountriesTableRow';

type Props = {
  countriesData: AllCountriesDisplayInfo[];
  showViewAllButton?: boolean;
  onViewAllCountries?: () => void;
  disableViewAllCountries?: boolean;
  classes?: {
    tableHeaderCell?: string;
  };
};

function AllCountriesTable({
  countriesData,
  showViewAllButton = false,
  onViewAllCountries,
  disableViewAllCountries = false,
  classes,
}: Props) {
  const { translate } = useTranslation();

  const tableHeaders = countriesData.map(({ displayHeader }) => (
    <TableCell key={displayHeader} className={classes?.tableHeaderCell ?? 'min-width-[150px]'}>
      <span className='text-label-large flex items-center gap-xsmall justify-end'>
        {displayHeader}
      </span>
    </TableCell>
  ));

  const tableRows = useMemo(() => {
    if (countriesData.length === 0) {
      return null;
    }

    // countriesData is column-major, so we transpose the data into rows to insert
    // into table. Each row is an array of RegionalPriceDisplayInfo
    const rowData = countriesData[0].allCountriesDisplayInfo.map((_, colIndex) =>
      countriesData.map((row) => row.allCountriesDisplayInfo[colIndex]),
    );

    return rowData.map((row) => (
      <AllCountriesTableRow
        key={row[0].country}
        country={row[0].country}
        displayPrices={row.map((r) => r.displayPrice)}
      />
    ));
  }, [countriesData]);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <span className='text-label-large'>
                {translate('Heading.AllCountriesTableCountry')}
              </span>
            </TableCell>
            {tableHeaders}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows}
          {showViewAllButton && (
            <TableRow>
              <TableCell colSpan={countriesData.length} className='padding-y-small padding-x-none'>
                <Button
                  className='text-caption-large'
                  onClick={onViewAllCountries}
                  disabled={disableViewAllCountries}>
                  {translate('Label.TopCountriesTableViewAllCountries')}
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default withTranslation(AllCountriesTable, [TranslationNamespace.RegionalPricing]);
