import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import Router from 'next/router';
import { useRobloxAuthentication } from '@rbx/auth';
import { getWebViewLoadingStyles } from '@rbx/studio-webview';
import { LinearProgress, makeStyles } from '@rbx/ui';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { creatorHub } from '@modules/miscellaneous/urls';

const useStyles = makeStyles()((theme) => ({
  loading: {
    width: '50%',
    maxWidth: 250,
    margin: '250px auto',
  },
  background: {
    // Apply specific styles when in a Studio WebView
    ...getWebViewLoadingStyles(),
    height: '100%',
    width: '100%',
    margin: '0',
  },
  content: {
    '.studio-webview &': {
      alignItems: 'center',
      display: 'flex',
      height: '100%',
    },
    maxWidth: 1500,
    width: '100%',
    margin: 'auto',
    padding: 32,
    [theme.breakpoints.down('XLarge')]: {
      padding: 24,
    },
  },
}));

const Authenticated: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const {
    classes: { loading, content, background },
  } = useStyles();
  const { status, login } = useRobloxAuthentication();

  useEffect(() => {
    if (process.env.buildTarget === 'luobu' && status === 'moderated') {
      void Router.push('/moderated');
    }

    if (status === 'unauthenticated') {
      void login();
    }

    if (status === 'logged-out') {
      void Router.push(creatorHub.getUrl());
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

  return <>{children}</>;
};

export default Authenticated;
