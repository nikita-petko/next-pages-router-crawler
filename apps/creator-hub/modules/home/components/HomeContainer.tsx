import React, { FunctionComponent, useEffect, useState } from 'react';
import Router from 'next/router';
import { LinearProgress, makeStyles } from '@rbx/ui';
import { CreatorHomeClient } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import AvatarAnalyticsClientProvider from '@modules/avatar-analytics/context/AvatarAnalyticsClientProvider';
import { getHomePageAnalyticsSectionProviders } from '@modules/experience-analytics-shared';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import CreatorProvider from '../providers/CreatorProvider';
import Home from './Home';
import { BannerProvider } from './banners/BannerProvider';

const useStyles = makeStyles()((theme) => ({
  loading: {
    width: '50%',
    maxWidth: 250,
    margin: '250px auto',
  },
  // NOTE (jcountryman,06/28/23): Required to fix wonky padding in
  // modules/navigation/layout/components/Layout.styles.ts L51
  background: {
    height: '100%',
    width: 'calc(100% + 96px)',
    margin: '-48px',
    backgroundColor: theme.palette.surface[0],
    [theme.breakpoints.down('XLarge')]: {
      width: 'calc(100% + 64px)',
      margin: '-32px',
    },
    [theme.breakpoints.down('Medium')]: {
      width: 'calc(100% + 24px)',
      margin: '-12px',
    },
  },
  content: {
    margin: '48px',
    [theme.breakpoints.down('XLarge')]: {
      margin: '24px',
    },
  },
}));

const HomeContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { groups } = useGroups();
  const { user, status } = useAuthentication();
  const {
    classes: { background, content, loading },
  } = useStyles();
  const [suppressed, setSuppressed] = useState<boolean>();

  const isUnauthenticatedUser =
    status === 'unauthenticated' ||
    status === 'moderated' ||
    status === 'error' ||
    status === 'logged-out';

  const redirectToLanding = isUnauthenticatedUser && process.env.buildTarget === 'global';

  useEffect(() => {
    if (redirectToLanding) {
      Router.replace('/landing');
    }
  }, [redirectToLanding]);

  useEffect(() => {
    const fetchSuppression = async () => {
      try {
        const { isSuppressed } = await CreatorHomeClient.userScreenApi.userScreenListUserScreen();
        setSuppressed(isSuppressed);
        if (isSuppressed === false) {
          Router.replace('/landing');
        }
      } catch {
        setSuppressed(true);
      }
    };

    fetchSuppression();
  }, []);

  if (suppressed === undefined || suppressed === false || redirectToLanding) {
    return (
      <div className={background}>
        <div className={content}>
          <LinearProgress classes={{ root: loading }} title='loading' />
        </div>
      </div>
    );
  }

  return (
    <div className={background}>
      <div className={content}>
        {user !== null && groups !== null ? (
          <CreatorProvider user={user} groups={groups}>
            <BannerProvider>
              <AvatarAnalyticsClientProvider>
                {getHomePageAnalyticsSectionProviders(<Home />)}
              </AvatarAnalyticsClientProvider>
            </BannerProvider>
          </CreatorProvider>
        ) : (
          <LinearProgress classes={{ root: loading }} title='loading' />
        )}
      </div>
    </div>
  );
};

export default HomeContainer;
