import React, { FunctionComponent, memo } from 'react';
import { ArrowUpwardIcon, ArrowDownwardIcon, Tooltip, Label, makeStyles } from '@rbx/ui';

export type ComparisonChipProps = {
  isUp: boolean;
  isGood: boolean;
  formattedLabel: string;
  tooltip?: string;
};

const useStyles = makeStyles()(() => ({
  icon: {
    fontSize: '1rem',
  },
}));

const ComparisonChip: FunctionComponent<ComparisonChipProps> = ({
  isGood,
  isUp,
  formattedLabel,
  tooltip,
}) => {
  const {
    classes: { icon },
  } = useStyles();

  return (
    <Tooltip title={tooltip} placement='right' arrow>
      <span>
        <Label
          labelText={formattedLabel}
          variant='contained'
          icon={
            isUp ? (
              <ArrowUpwardIcon classes={{ root: icon }} />
            ) : (
              <ArrowDownwardIcon classes={{ root: icon }} />
            )
          }
          severity={isGood ? 'success' : 'default'}
        />
      </span>
    </Tooltip>
  );
};

export default memo(ComparisonChip);
