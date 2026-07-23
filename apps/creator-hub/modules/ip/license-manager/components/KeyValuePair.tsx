import React from 'react';
import { InfoOutlinedIcon, makeStyles, Tooltip, Typography } from '@rbx/ui';

const useKeyValuePairStyles = makeStyles()((theme) => ({
  list: {
    margin: 0, // reset margin
    '& > div + div': {
      marginTop: 12,
    },
    dd: {
      marginTop: 4,
    },
  },
  tooltipContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  icon: {
    color: theme.palette.content.muted,
    paddingLeft: 5,
  },
}));

/**
 * A container for key-value pairs.
 * Intended to be used with`KeyValuePair`s as direct children
 */
export const KeyValuePairContainer = ({ children }: { children: React.ReactNode }) => {
  const { classes } = useKeyValuePairStyles();
  return <dl className={classes.list}>{children}</dl>;
};

/**
 * A key-value pair.
 * Intended to be used within a `KeyValuePairContainer`
 */
export const KeyValuePair = ({
  label,
  value,
  tooltipText,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tooltipText?: string;
}) => {
  const { classes } = useKeyValuePairStyles();

  if (tooltipText) {
    return (
      <div>
        <div className={classes.tooltipContainer}>
          <Typography variant='h6' component='dt'>
            {label}
          </Typography>
          <Tooltip arrow placement='right' title={tooltipText}>
            <InfoOutlinedIcon fontSize='medium' className={classes.icon} data-testid='info-icon' />
          </Tooltip>
        </div>

        <Typography variant='body1' component='dd'>
          {value}
        </Typography>
      </div>
    );
  }
  return (
    <div>
      <Typography variant='h6' component='dt'>
        {label}
      </Typography>
      <Typography variant='body1' component='dd'>
        {value}
      </Typography>
    </div>
  );
};
