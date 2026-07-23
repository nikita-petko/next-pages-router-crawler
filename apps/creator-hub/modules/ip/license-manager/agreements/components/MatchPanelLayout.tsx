import type { FunctionComponent } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, Typography, IconButton, CloseIcon, CircularProgress } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
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
    gap: theme.spacing(2),
    // we have content (ContentTile) that overflow it's normal dimensions,
    // which doesn't work in a scrollable container.
    // So we'll "pull" the outside margin and put it inside the container
    // instead
    marginLeft: theme.spacing(-3),
    paddingLeft: theme.spacing(3),
    marginRight: theme.spacing(-3),
    paddingRight: theme.spacing(3),
  },
  loading: {
    margin: 'auto',
  },
  closeButton: {
    flexShrink: 0,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  errorContainer: {
    marginTop: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(2),
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
    '& button:hover, & button:active': {
      background: 'none',
      backgroundColor: 'transparent',
    },
    '& button [role="presentation"]': {
      background: 'none !important',
    },
    '& button:hover [role="presentation"], & button:active [role="presentation"]': {
      background: 'none !important',
    },
  },
  headerTitle: {
    minWidth: 0,
  },
  headerLeading: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
  },
  headerControls: {
    display: 'flex',
    flexShrink: 0,
    marginLeft: theme.spacing(1.5),
  },
}));

interface MatchPanelLayoutProps {
  title: string;
  onClose: () => void;
  children?: ReactNode;
  actionError?: ReactNode;
  buttons?: ReactNode;
  headerControls?: ReactNode;
  onSubmit?: (event: SyntheticEvent<HTMLFormElement>) => void;
  loading?: boolean;
}

/**
 * Shared layout component for match-related side panels.
 */
const MatchPanelLayout: FunctionComponent<MatchPanelLayoutProps> = ({
  title,
  onClose,
  children,
  actionError,
  buttons,
  headerControls,
  onSubmit,
  loading,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  const content = (
    <>
      <div className={classes.headerContainer}>
        <div className={classes.headerLeading}>
          <Typography variant='h4' className={classes.headerTitle}>
            {title}
          </Typography>
          {headerControls && <div className={classes.headerControls}>{headerControls}</div>}
        </div>

        <IconButton
          onClick={onClose}
          aria-label={translate('Action.Close')}
          color='secondary'
          size='large'
          className={classes.closeButton}>
          <CloseIcon fontSize='inherit' />
        </IconButton>
      </div>

      <div className={classes.content}>
        {loading ? <CircularProgress className={classes.loading} /> : children}
      </div>

      {actionError && <div className={classes.errorContainer}>{actionError}</div>}

      {buttons && <div className={classes.buttonContainer}>{buttons}</div>}
    </>
  );

  return onSubmit ? (
    <form className={classes.container} onSubmit={onSubmit}>
      {content}
    </form>
  ) : (
    <div className={classes.container}>{content}</div>
  );
};

export default MatchPanelLayout;
