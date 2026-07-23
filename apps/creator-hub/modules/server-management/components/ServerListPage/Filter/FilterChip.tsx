import { useTranslation } from '@rbx/intl';
import { Chip, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { Grid } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import useFilterChipRowStyles from './FilterChipRow.styles';

export interface FilterChipProps {
  label: string;
  isValid: boolean;
  onClick: () => void;
}

const FilterChip: FunctionComponent<FilterChipProps> = ({ label, isValid, onClick }) => {
  const { translate } = useTranslation();
  const { classes } = useFilterChipRowStyles();

  const { filterDisabledChip } = classes;

  return isValid ? (
    <Grid item>
      <Chip
        text={label}
        color='secondary'
        size='Medium'
        variant='Standard'
        isChecked={false}
        trailing='icon-regular-x'
        onCheckedChange={onClick}
      />
    </Grid>
  ) : (
    <Grid item>
      <Tooltip
        title=''
        description={translate('ServerListTable.Filter.RestartRestrction.Tooltip')}
        position='bottom-center'>
        <TooltipTrigger asChild>
          <Chip
            text={label}
            color='secondary'
            size='Medium'
            variant='Utility'
            isChecked={false}
            trailing='icon-regular-x'
            leading='icon-regular-circle-i'
            className={filterDisabledChip}
            onCheckedChange={onClick}
          />
        </TooltipTrigger>
      </Tooltip>
    </Grid>
  );
};

export default FilterChip;
