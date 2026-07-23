import React from 'react';
import { Select, MenuItem, Typography, TSelectProps, makeStyles } from '@rbx/ui';
import type { LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';
import { useTranslation } from '@rbx/intl';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';

import { getDauLicenseLabelFromEnum } from '../../utils/dauEnum';
import { getMaturityRatingLabel } from '../../utils/maturityRating';

const useStyles = makeStyles()(() => ({
  optionContent: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  detailsRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
}));

interface LicenseOptionContentProps {
  license: LicenseResponse;
  /** Shows a simplified version of the license content */
  simple?: boolean;
}

/**
 * Display a list of `License` items in a select menu. Each menu item as well as
 * the value will show the license name, royalty rate, minimum DAU,
 * maximum maturity rating and eligibility.
 */
const LicenseOptionContent: React.FC<LicenseOptionContentProps> = ({ license, simple }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  return (
    <div className={classes.optionContent}>
      <Typography variant='body1' fontWeight='medium' component='div'>
        {license.name}
      </Typography>
      <div className={classes.detailsRow}>
        <Typography variant='body2' color='secondary'>
          {translate('Label.RevenueShareWithValue', {
            value: formatRoyaltyRate(license.royaltyRate),
          })}
        </Typography>
      </div>
      {!simple && (
        <div className={classes.detailsRow}>
          <Typography variant='body2' color='secondary'>
            {translate('Label.MinimumDAUWithValue', {
              value: translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold)),
            })}
          </Typography>
          <Typography variant='body2' color='secondary'>
            •
          </Typography>
          <Typography variant='body2' color='secondary'>
            {translate('Label.MaxMaturityRatingWithValue', {
              value: translate(getMaturityRatingLabel(license.maxAgeRating)),
            })}
          </Typography>
        </div>
      )}
    </div>
  );
};

interface LicenseSelectProps extends Omit<TSelectProps, 'children'> {
  licenses: LicenseResponse[];
}

const LicenseSelect = React.forwardRef<HTMLDivElement, LicenseSelectProps>(
  ({ licenses, ...selectProps }, ref) => {
    const { translate } = useTranslation();

    const renderValue = (value: unknown) => {
      if (!value) return null;

      const selectedLicense = licenses.find((license) => license.id === value);
      if (!selectedLicense) return null;

      return <LicenseOptionContent license={selectedLicense} simple />;
    };

    return (
      <Select {...selectProps} renderValue={renderValue} ref={ref}>
        {licenses.length > 0 ? (
          licenses.map((license) => (
            <MenuItem key={license.id!} value={license.id!}>
              <LicenseOptionContent license={license} />
            </MenuItem>
          ))
        ) : (
          <MenuItem value=''>{translate('Label.NoLicensesAvailable')}</MenuItem>
        )}
      </Select>
    );
  },
);

LicenseSelect.displayName = 'LicenseSelect';

export default LicenseSelect;
