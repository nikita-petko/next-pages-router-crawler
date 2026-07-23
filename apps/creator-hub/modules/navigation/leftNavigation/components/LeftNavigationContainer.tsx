import React, {
  type FunctionComponent,
  ReactNode,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { Grid, Divider, Drawer, Button, ArrowBackIcon } from '@rbx/ui';
import { useNavigationConfigs } from '@rbx/creator-hub-navigation';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import { useTranslation } from '@rbx/intl';
// eslint-disable-next-line no-restricted-imports -- CreationsCustomSettingsProvider should be refactored out of creations
import { CreationsCustomSettingsProvider } from '@modules/creations/common/implementations/creationsCustomSettings';
import useTopNavigationSidebarDrawer from '../../layout/hooks/useTopNavigationSidebarDrawer';
import LeftNavigationStateContext from '../../layout/hooks/LeftNavigationStateContext';
import useAppBreadcrumbsData from '../../layout/hooks/useAppBreadcrumbsData';
import LeftNavigation from './LeftNavigation';
import useLeftNavigationContainerStyles from './LeftNavigationContainer.styles';
import useLayoutStyles from '../../layout/components/Layout.styles';

interface LeftNavigationContainerProps {
  primarySidebarExpanded: boolean;
  setPrimarySidebarExpanded?: (state: boolean) => void;
  secondaryleftNavigationContents?: ReactNode;
  useExperienceNavigation?: boolean;
}

const LeftNavigationContainer: FunctionComponent<
  React.PropsWithChildren<LeftNavigationContainerProps>
> = ({
  primarySidebarExpanded,
  useExperienceNavigation = false,
  setPrimarySidebarExpanded = () => {
    // placeholder implementation
  },
  secondaryleftNavigationContents,
}) => {
  const {
    classes: {
      root,
      primaryLeftNav,
      primaryLeftNavCollapsedContainer,
      secondaryLeftNavContainer,
      secondaryLeftNavOverlay,
      primaryLeftNavExpanded,
      secondaryLeftNav,
      leftNavExpanded,
      primaryLeftNavContent,
      parentLeftNavDrawer,
      leftNavDrawer,
      backButton,
    },
    cx,
  } = useLeftNavigationContainerStyles({ useExperienceNavigation });
  const {
    classes: { scrollableY },
  } = useLayoutStyles();
  const { insideTopNavigationDrawer } = useTopNavigationSidebarDrawer();
  const { parentBreadcrumbLevels } = useAppBreadcrumbsData();
  const { translate } = useTranslation();
  const { toggleHomeDrawerOpen } = useNavigationConfigs();
  const [openDrawers, setOpenDrawers] = useState<number[]>([]);
  const getSidbarBackLinkName = useCallback(
    (parentIndex: number) => {
      if (parentIndex === parentBreadcrumbLevels.length) {
        // parent is hub root level
        return translate('Label.CreatorHub');
      }
      const parent = parentBreadcrumbLevels[parentIndex];
      return parent.sidebarName ?? translate('Action.Back');
    },
    [parentBreadcrumbLevels, translate],
  );
  const openParentSidebar = useCallback(
    (parentIndex: number) => {
      if (parentIndex === parentBreadcrumbLevels.length) {
        // parent is hub root level
        toggleHomeDrawerOpen(true);
      } else {
        setOpenDrawers([...openDrawers, parentIndex]);
      }
    },
    [openDrawers, parentBreadcrumbLevels.length, toggleHomeDrawerOpen],
  );
  const navigationContext = useMemo(() => ({ primarySidebarExpanded: true }), []);

  useEffect(() => {
    function onWindowBlur() {
      if (secondaryleftNavigationContents) {
        setPrimarySidebarExpanded(false);
      }
    }

    window.addEventListener('blur', onWindowBlur);

    return () => {
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [secondaryleftNavigationContents, setPrimarySidebarExpanded]);

  if (insideTopNavigationDrawer) {
    return (
      <LeftNavigationStateContext.Provider value={navigationContext}>
        <Grid className={root} component='aside' direction='row' container>
          <Grid className={cx(scrollableY, leftNavDrawer)} item component='nav'>
            <Button
              color='primary'
              size='small'
              startIcon={<ArrowBackIcon />}
              className={backButton}
              onClick={() => {
                openParentSidebar(0);
              }}>
              {getSidbarBackLinkName(0)}
            </Button>
            {secondaryleftNavigationContents}
          </Grid>
        </Grid>
        {parentBreadcrumbLevels.map((parentBreadcrumbLevel, index) => {
          const { SidebarComponent, pathname } = parentBreadcrumbLevel;
          return (
            <Drawer
              variant='persistent'
              anchor='left'
              open={openDrawers.includes(index)}
              classes={{
                paper: cx(parentLeftNavDrawer, scrollableY),
              }}
              key={pathname}>
              <Button
                color='primary'
                size='small'
                startIcon={<ArrowBackIcon />}
                className={backButton}
                onClick={() => {
                  openParentSidebar(index + 1);
                }}>
                {getSidbarBackLinkName(index + 1)}
              </Button>
              <SidebarComponent />
            </Drawer>
          );
        })}
      </LeftNavigationStateContext.Provider>
    );
  }

  if (secondaryleftNavigationContents) {
    return (
      <Grid className={root} component='aside' direction='row' container>
        <Grid className={cx(primaryLeftNavCollapsedContainer, scrollableY)} item component='nav'>
          <Grid
            className={cx(primaryLeftNav, {
              [primaryLeftNavExpanded]: primarySidebarExpanded,
            })}
            container
            onMouseEnter={() => {
              setPrimarySidebarExpanded(true);
            }}
            onMouseLeave={(e) => {
              // NOTE(yanzhuang, 02/2024): Safari edge case, extra mouseleave is
              // triggered when hovering over group popup menu (with whole
              // screen backdrop) within the sidebar, should ignore and keep
              // sidebar expanded.
              if (e.relatedTarget === window) return;
              setPrimarySidebarExpanded(false);
            }}
            alignItems='stretch'
            wrap='nowrap'>
            <Grid
              XSmall
              item
              container
              direction='column'
              className={primaryLeftNavContent}
              wrap='nowrap'>
              <ToolboxServiceApiProvider>
                <LeftNavigation />
              </ToolboxServiceApiProvider>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          className={cx(
            { [secondaryLeftNavOverlay]: primarySidebarExpanded },
            secondaryLeftNavContainer,
            scrollableY,
          )}
          item
          component='nav'>
          <Grid className={cx(leftNavExpanded, secondaryLeftNav)} container direction='column'>
            {secondaryleftNavigationContents}
          </Grid>
        </Grid>
        <Divider orientation='vertical' flexItem />
      </Grid>
    );
  }

  return (
    <Grid className={root} component='aside' direction='row' container>
      <Grid className={scrollableY} item component='nav'>
        <Grid
          className={cx(primaryLeftNav, {
            [primaryLeftNavExpanded]: primarySidebarExpanded,
          })}
          container
          alignItems='stretch'
          wrap='nowrap'>
          <Grid
            XSmall
            item
            container
            direction='column'
            className={primaryLeftNavContent}
            wrap='nowrap'>
            <ToolboxServiceApiProvider>
              <LeftNavigation />
            </ToolboxServiceApiProvider>
          </Grid>
        </Grid>
      </Grid>
      <Divider orientation='vertical' flexItem />
    </Grid>
  );
};

const LeftNavigationIAContainer: FunctionComponent<
  React.PropsWithChildren<LeftNavigationContainerProps>
> = (props) => {
  const { useExperienceNavigation } = props;
  if (useExperienceNavigation) {
    return (
      <CreationsCustomSettingsProvider>
        <LeftNavigationContainer {...props} />
      </CreationsCustomSettingsProvider>
    );
  }

  return <LeftNavigationContainer {...props} />;
};

export default LeftNavigationIAContainer;
