import React, { Fragment, FunctionComponent, useEffect } from 'react';
import { LinearProgress, makeStyles } from '@rbx/ui';
import Router from 'next/router';
import { useRobloxAuthentication } from '@rbx/auth';
import { creatorHub } from '@modules/miscellaneous/common/urls';
import LoadError from '@modules/miscellaneous/error/LoadError';

const useStyles = makeStyles()((theme) => ({
  loading: {
    width: '50%',
    maxWidth: 250,
    margin: '250px auto',
  },
  background: {
    height: '100%',
    width: '100%',
    margin: '0',
  },
  content: {
    maxWidth: 1500,
    width: '100%',
    margin: 'auto',
    padding: 32,
    [theme.breakpoints.down('XLarge')]: {
      padding: 24,
    },
  },
}));

const Authenticated: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
  const {
    classes: { loading, content, background },
  } = useStyles();
  const { status, login } = useRobloxAuthentication();

  useEffect(() => {
    if (process.env.buildTarget === 'luobu' && status === 'moderated') {
      Router.push('/moderated');
    }

    if (status === 'unauthenticated') {
      login();
    }

    if (status === 'logged-out') {
      Router.push(creatorHub.getUrl());
    }
  }, [login, status]);

  if (status === 'initial' || status === 'loading') {
    return (
      <div className={background}>
        <div className={content}>
          <LinearProgress classes={{ root: loading }} title='loading' />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={background}>
        <div className={content}>
          <LoadError
            onReload={() => {
              Router.reload();
            }}
          />
        </div>
      </div>
    );
  }

  return <Fragment>{children}</Fragment>;
};

export default Authenticated;
