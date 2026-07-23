import React from 'react';
import { Select, MenuItem, Typography, TSelectProps, makeStyles } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

const useStyles = makeStyles()(() => ({
  detailsRow: {
    alignItems: 'center',
    maxWidth: '500px',
    textWrap: 'wrap',
  },
}));

export enum RevShareTiming {
  Later = 'later',
  OnActivation = 'on-activation',
}

interface RevShareTimingOptionContentProps {
  revShareTiming: RevShareTiming;
  /** Shows a simplified version of the revenue share timing content */
  simple?: boolean;
}

/**
 * Display the revShareTiming options in a dropdown select menu.
 * Simple view is displayed in the collapsed select menu.
 * Expanded view is displayed in the focused select menu.
 */
const RevShareTimingOptionContent: React.FC<RevShareTimingOptionContentProps> = ({
  revShareTiming,
  simple,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const isTimingLater = revShareTiming === RevShareTiming.Later;

  if (simple) {
    return (
      <Typography variant='body1' fontWeight='medium' component='div'>
        {translate(isTimingLater ? 'Label.MonetizeLater' : 'Label.MonetizeOnActivation')}
      </Typography>
    );
  }

  return (
    <div className={classes.detailsRow}>
      <Typography variant='body1' fontWeight='medium' color='secondary' component='div'>
        {translate(isTimingLater ? 'Label.MonetizeLater' : 'Label.MonetizeOnActivation')}
      </Typography>
      <div>
        <Typography variant='body2' component='div'>
          {isTimingLater ? translate('Label.MonitorRevshare') : translate('Label.MonitorOnly')}
        </Typography>
      </div>
    </div>
  );
};

interface RevShareTimingSelectProps extends Omit<TSelectProps, 'children'> {
  revShareTiming: RevShareTiming | null;
}

const RevShareTimingSelect = React.forwardRef<HTMLDivElement, RevShareTimingSelectProps>(
  ({ revShareTiming, ...selectProps }, ref) => {
    const renderValue = (value: unknown) => {
      if (!value) return null;

      return (
        <RevShareTimingOptionContent
          revShareTiming={revShareTiming ?? RevShareTiming.Later}
          simple
        />
      );
    };

    return (
      <Select {...selectProps} renderValue={renderValue} ref={ref}>
        <MenuItem value={RevShareTiming.OnActivation}>
          <RevShareTimingOptionContent revShareTiming={RevShareTiming.OnActivation} />
        </MenuItem>
        <MenuItem value={RevShareTiming.Later}>
          <RevShareTimingOptionContent revShareTiming={RevShareTiming.Later} />
        </MenuItem>
      </Select>
    );
  },
);

RevShareTimingSelect.displayName = 'RevShareTimingSelect';

export default RevShareTimingSelect;
