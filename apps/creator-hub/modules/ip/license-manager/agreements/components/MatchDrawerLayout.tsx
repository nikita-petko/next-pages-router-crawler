import { Fragment, FunctionComponent, type ReactNode, type SyntheticEvent } from 'react';
import { makeStyles, Typography, IconButton, CloseIcon, CircularProgress } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    // we have content (ContentTile) that overflow it's normal dimensions,
    // which doesn't work in a scrollable container.
    // So we'll "pull" the outside margin and put it inside the container
    // instead
    marginLeft: -24,
    paddingLeft: 24,
    marginRight: -24,
    paddingRight: 24,
  },
  loading: {
    margin: 'auto',
  },
  closeButton: {
    marginBottom: 24,
  },
  errorContainer: {
    marginTop: 16,
  },
  buttonContainer: {
    display: 'flex',
    gap: 12,
    paddingTop: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
}));

interface MatchDrawerLayoutProps {
  title: string;
  onClose: () => void;
  children?: ReactNode;
  actionError?: ReactNode;
  buttons?: ReactNode;
  onSubmit?: (event: SyntheticEvent<HTMLFormElement>) => void;
  loading?: boolean;
}

/**
 * Shared layout component for match-related drawers
 */
const MatchDrawerLayout: FunctionComponent<MatchDrawerLayoutProps> = ({
  title,
  onClose,
  children,
  actionError,
  buttons,
  onSubmit,
  loading,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  const content = (
    <Fragment>
      <div className={classes.headerContainer}>
        <IconButton
          onClick={onClose}
          aria-label={translate('Action.Close')}
          color='secondary'
          size='small'
          className={classes.closeButton}>
          <CloseIcon fontSize='small' />
        </IconButton>

        <Typography variant='h4' component='h1' gutterBottom>
          {title}
        </Typography>
      </div>

      <div className={classes.content}>
        {loading ? <CircularProgress className={classes.loading} /> : children}
      </div>

      {actionError && <div className={classes.errorContainer}>{actionError}</div>}

      {buttons && <div className={classes.buttonContainer}>{buttons}</div>}
    </Fragment>
  );

  return onSubmit ? (
    <form className={classes.container} onSubmit={onSubmit}>
      {content}
    </form>
  ) : (
    <div className={classes.container}>{content}</div>
  );
};

export default MatchDrawerLayout;
