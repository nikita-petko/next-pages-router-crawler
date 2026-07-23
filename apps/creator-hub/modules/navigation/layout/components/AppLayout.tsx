import React, {
  type FunctionComponent,
  type ReactNode,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@sentry/nextjs';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAuthentication } from '@modules/authentication/providers';
import { Grid, useMediaQuery, NoSSR } from '@rbx/ui';
import { useRouteChange } from '@modules/miscellaneous/hooks';
import LoadError from '@modules/miscellaneous/error/LoadError';
import {
  LuobuFooter,
  PrivateFooter,
  PublicFooter,
  useNavigationConfigs,
} from '@rbx/creator-hub-navigation';
import { CookieConsentBanner } from '@rbx/cookie-banner';
import { useSettings } from '@modules/settings';
import UnifiedTopNavigation from '../../topNavigation/components/UnifiedTopNavigation';
import LeftNavigationContainer from '../../leftNavigation/components/LeftNavigationContainer';
import { AppLayoutContentContainerId } from '../../utils/getAppLayoutContentContainerElement';
import useFooterBehavior from '../hooks/useFooterBehavior';
import AppBreadcrumbs from './AppBreadcrumbs';
import useLeftNavigationState from '../hooks/useLeftNavigationState';
import useLayoutStyles from './Layout.styles';
import useAppLayoutStyles from './AppLayout.styles';

const PrivacyChoicesFooterLink = dynamic(
  () => import('../../components/PrivacyChoicesFooterLink'),
  { ssr: false },
);

export const SCROLL_CONTAINER_ID = 'applayout-scroll-container';
export interface AppLayoutProps {
  disableLeftNavigation?: boolean;
  leftNavigationContents?: ReactNode;
  noBreadCrumbs?: boolean;
  usePublicFooter?: boolean;
  useExperienceNavigation?: boolean;
}

const AppLayout: FunctionComponent<React.PropsWithChildren<AppLayoutProps>> = ({
  disableLeftNavigation = false,
  leftNavigationContents: leftNav,
  useExperienceNavigation = false,
  noBreadCrumbs = false,
  usePublicFooter = false,
  children,
}) => {
  const { user } = useAuthentication();
  const footerBehavior = useFooterBehavior();

  const { settings } = useSettings();

  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    classes: {
      contentV2,
      fullWidthContentV2,
      minHeight,
      fullHeight,
      centerContent,
      scrollableY,
      positionRelative,
    },
    cx,
  } = useLayoutStyles();
  const {
    classes: { root, main },
  } = useAppLayoutStyles();

  const leftNavigationContents = useMemo(() => {
    if (!useExperienceNavigation) {
      return leftNav;
    }

    return leftNav;
  }, [leftNav, useExperienceNavigation]);

  const { toggleProductNavigationDrawer } = useNavigationConfigs();

  // in tablet view for creator dashboard, we put left navigation content inside
  // top nav drawer
  const isTabletView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const showLeftNavigationInTopNavDrawerInstead = isTabletView;

  // this will keep displaying the left navigation until the request to users
  // API come back, make it this way since 99% of the time this layout is used
  // in a feature that requires an authenticated user
  const hasLeftNavigation = !disableLeftNavigation && user !== null;
  const showLeftNavigation = !showLeftNavigationInTopNavDrawerInstead && hasLeftNavigation;

  const handleRouteChangeComplete = useCallback(() => {
    if (toggleProductNavigationDrawer) {
      toggleProductNavigationDrawer(false);
    }
  }, [toggleProductNavigationDrawer]);
  useRouteChange(undefined, handleRouteChangeComplete);

  const { primarySidebarExpanded, setPrimarySidebarExpanded } = useLeftNavigationState();
  useEffect(() => {
    if (!setPrimarySidebarExpanded) {
      return;
    }
    // collpase/expand sidebar async to have width collapse animation when switching pages
    setTimeout(() => {
      setPrimarySidebarExpanded(!leftNavigationContents);
    }, 0);
  }, [leftNavigationContents, setPrimarySidebarExpanded]);
  // +---------------------------------------------------------+
  // |  Top Navigation Bar                                    ||
  // +---------------------------------------------------------+
  // |-----|---------||----------------------------------------|
  // | Left| Left    ||    Right Main Content                 ||
  // | Nav1| Nav2    ||                                       ||
  // |     |         ||                                       ||
  // |     |         ||                                       ||
  // |     |         ||                                       ||
  // |     |         ||+--------------------------------------+|
  // |     |         ||  Bottom Footer                        ||
  // |     |         ||                                       ||
  // |     |         |+---------------------------------------+|
  // +--------------------------------------------------------+
  return (
    <Grid className={root} container direction='column'>
      {/* NOTE(zwang 12-04-2023): Workaround for the issue, more investigation in CRF-4636 */}
      <NoSSR>
        <UnifiedTopNavigation
          disableLeftNavigation={disableLeftNavigation}
          leftNavigationContents={hasLeftNavigation ? leftNavigationContents : null}
        />

        <Grid
          id={AppLayoutContentContainerId}
          XSmall
          container
          item
          direction='row'
          className={cx(minHeight, positionRelative)}>
          <Grid item className={fullHeight} id='left-navigation'>
            {!showLeftNavigationInTopNavDrawerInstead && (showLeftNavigation || isCompactView) && (
              <LeftNavigationContainer
                primarySidebarExpanded={primarySidebarExpanded}
                setPrimarySidebarExpanded={setPrimarySidebarExpanded}
                secondaryleftNavigationContents={
                  !showLeftNavigation && isCompactView ? null : leftNavigationContents
                }
              />
            )}
          </Grid>
          <Grid
            id={SCROLL_CONTAINER_ID}
            item
            XSmall
            className={cx(centerContent, fullHeight, scrollableY)}>
            <Grid
              className={
                !showLeftNavigationInTopNavDrawerInstead && showLeftNavigation
                  ? contentV2
                  : fullWidthContentV2
              }
              container
              direction='column'
              wrap='nowrap'>
              <Grid className={main} component='main' item alignItems='stretch'>
                {!noBreadCrumbs && <AppBreadcrumbs />}
                <ErrorBoundary
                  fallback={({ resetError }) => {
                    return <LoadError onReload={resetError} />;
                  }}>
                  {children}
                </ErrorBoundary>
              </Grid>
              <footer>
                {process.env.buildTarget === 'luobu' ? (
                  <LuobuFooter />
                ) : (
                  <Fragment>
                    {usePublicFooter && <PublicFooter />}
                    <PrivateFooter
                      behavior={footerBehavior}
                      additionalLinks={
                        settings.enableGPCFooter ? <PrivacyChoicesFooterLink inline /> : undefined
                      }
                    />
                  </Fragment>
                )}
              </footer>
            </Grid>
          </Grid>
        </Grid>
        <CookieConsentBanner />
      </NoSSR>
    </Grid>
  );
};

export default withTranslation(AppLayout, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Creations,
  TranslationNamespace.Features,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.SendrNotificationPreferences,
  TranslationNamespace.Advanced,
  TranslationNamespace.OpenCloud,
  TranslationNamespace.Error,
  TranslationNamespace.DataCollectionSettings,
  TranslationNamespace.UnifiedNavigation,
  TranslationNamespace.Payouts,
  TranslationNamespace.Matchmaking,
  TranslationNamespace.Environments,
  TranslationNamespace.ServerManagement,
  TranslationNamespace.Privacy,
]);
