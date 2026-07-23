import type { FunctionComponent } from 'react';
import React from 'react';
import type { RestrictedCountry } from '@rbx/client-experience-questionnaire/v1';
import { useTranslation } from '@rbx/intl';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@rbx/ui';
import InfoTooltip from '../components/InfoTooltip';
import useExperienceGuidelinesStyles from './ExperienceGuidelines.styles';

interface RestrictionsTableProps {
  restrictedCountries: Array<RestrictedCountry>;
  isContentMaturityEnabled: boolean;
}

const RestrictionsTable: FunctionComponent<React.PropsWithChildren<RestrictionsTableProps>> = ({
  restrictedCountries,
  isContentMaturityEnabled,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { table, firstColumnHeader, tooltip },
  } = useExperienceGuidelinesStyles();

  return (
    <Table aria-label={translate('Title.ComplianceTable')} className={table}>
      <TableHead>
        <TableRow>
          <TableCell className={firstColumnHeader}>
            <div className={tooltip}>
              <Typography variant='tableHead'>
                {translate('Title.GuidelinesRestrictedCountries')}
              </Typography>
              <InfoTooltip
                translationKey={
                  isContentMaturityEnabled
                    ? 'Tooltip.MaturityNonCompliantRegionRestrictionHeader'
                    : 'Tooltip.NonCompliantRegionRestrictionHeader'
                }
              />
            </div>
          </TableCell>
          <TableCell>
            <div className={tooltip}>
              <Typography variant='tableHead'>{translate('TableHead.Descriptors')}</Typography>
              <InfoTooltip translationKey='Tooltip.ContentDescriptorRestrictionHeader' />
            </div>
          </TableCell>
          <TableCell>
            <div className={tooltip}>
              <Typography variant='tableHead'>
                {translate('Title.GuidelinesAgeRestriction')}
              </Typography>
              <InfoTooltip translationKey='Tooltip.AgeRestrictionHeader' />
            </div>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {restrictedCountries.length > 0 ? (
          // Sort the countries by country code. For each country render a row in the table.
          restrictedCountries
            .sort((a, b) => a.countryCode.localeCompare(b.countryCode))
            .map((countryRestriction) => {
              return (
                <TableRow
                  key={`${countryRestriction.countryCode}-${countryRestriction.displayDescriptorName}`}>
                  <TableCell>
                    <Typography variant='body2'>{countryRestriction.displayCountryName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      <div>{countryRestriction.displayDescriptorName}</div>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      <div>{countryRestriction.displayAgeRangeName}</div>
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })
        ) : (
          <TableRow>
            <TableCell>
              <Typography variant='body2'>{translate('Message.NoRestrictedCountries')}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant='body2'>{translate('Message.NoFeatures')}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant='body2' />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
export default RestrictionsTable;
