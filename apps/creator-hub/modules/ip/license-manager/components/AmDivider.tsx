import type { FunctionComponent } from 'react';
import { Divider, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  divider: {
    borderColor: theme.palette.components.divider,
    height: '1px',
  },
  bottomMargin: {
    marginBottom: 16,
  },
  topMargin: {
    marginTop: 16,
  },
}));

interface DividerProps {
  hasBottomMargin?: boolean;
  hasTopMargin?: boolean;
}

/**
 * Divider to use on Agreements Manager pages.
 * Deviating from WebBlox due to design specifications.
 */
const AmDivider: FunctionComponent<DividerProps> = ({
  hasBottomMargin = false,
  hasTopMargin = false,
}) => {
  const { classes, cx } = useStyles();

  return (
    <Divider
      aria-hidden='true'
      className={cx(
        classes.divider,
        hasBottomMargin ? classes.bottomMargin : null,
        hasTopMargin ? classes.topMargin : null,
      )}
    />
  );
};

export default AmDivider;
