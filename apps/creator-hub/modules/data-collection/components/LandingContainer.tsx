import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { LinearProgress, makeStyles } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BasicLayout from '@modules/navigation/layout/components/BasicLayout';
import Landing from './Landing';
import LandingHead from './LandingHead';

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
    backgroundColor: theme.palette.surface[0],
    // NOTE (jcountryman,06/28/23): Required to fix wonky padding in
    // modules/navigation/layout/components/Layout.styles.ts L51
    [theme.breakpoints.down('XLarge')]: {
      width: 'calc(100% + 64px)',
      margin: '-32px',
    },
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
      margin: '0',
    },
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

const DataCollectionContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { user, isFetched } = useAuthentication();
  const {
    classes: { background, content, loading },
  } = useStyles();

  if (!isFetched) {
    return (
      <BasicLayout>
        <div className={background}>
          <div className={content}>
            <LinearProgress classes={{ root: loading }} title='loading' />
          </div>
        </div>
      </BasicLayout>
    );
  }

  if (process.env.buildTarget === 'luobu') {
    return (
      <BasicLayout>
        <PageNotFound />
      </BasicLayout>
    );
  }

  return (
    <BasicLayout product='DataCollection'>
      <div className={background}>
        <div className={content}>
          <LandingHead />
          <Landing isAuthenticated={user !== null} />
        </div>
      </div>
    </BasicLayout>
  );
};

export default withTranslation(DataCollectionContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.RoadMap,
]);
