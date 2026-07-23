import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { LicenseDurationType } from '@rbx/client-content-licensing-api/v1';
import { Chip } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import type { PublicLicenseDurationFilter } from '../utils/publicLicenseDurationFilter';

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

export interface PublicLicensesDurationFilterPillsProps {
  selected: PublicLicenseDurationFilter;
  onChange: (value: PublicLicenseDurationFilter) => void;
}

const PublicLicensesDurationFilterPills: FunctionComponent<
  PublicLicensesDurationFilterPillsProps
> = ({ selected, onChange }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  const onAllCheckedChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        onChange('all');
      }
    },
    [onChange],
  );

  const onTimeLimitedCheckedChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        onChange(LicenseDurationType.TimeLimited);
      }
    },
    [onChange],
  );

  const onPerpetualCheckedChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        onChange(LicenseDurationType.Perpetual);
      }
    },
    [onChange],
  );

  return (
    <div className={classes.row} data-testid='public-licenses-duration-filter-pills'>
      <Chip
        key='all'
        text={translate('Label.All')}
        size='Medium'
        isChecked={selected === 'all'}
        onCheckedChange={onAllCheckedChange}
      />
      <Chip
        key={LicenseDurationType.TimeLimited}
        text={translate('Label.TimeLimited')}
        size='Medium'
        isChecked={selected === LicenseDurationType.TimeLimited}
        onCheckedChange={onTimeLimitedCheckedChange}
      />
      <Chip
        key={LicenseDurationType.Perpetual}
        text={translate('Label.Perpetual')}
        size='Medium'
        isChecked={selected === LicenseDurationType.Perpetual}
        onCheckedChange={onPerpetualCheckedChange}
      />
    </div>
  );
};

export default PublicLicensesDurationFilterPills;
