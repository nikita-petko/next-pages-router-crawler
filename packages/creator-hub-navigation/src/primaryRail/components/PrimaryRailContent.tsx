import React, { useCallback, useMemo } from 'react';
import { Divider, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  BuilderChatSideFillIcon,
  BuilderChatSideIcon,
  BuilderHomeFillIcon,
  BuilderHomeIcon,
  Button,
  Grid,
  RobloxIcon,
  StudioIcon,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import WorkplaceSelector from '../../components/WorkplaceSelector';
import {
  clickNavPrimaryRailCollapseEventModel,
  clickRailEventModel,
} from '../../event/eventConstants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import useScrollStyles from '../../hooks/useScrollStyles';
import { RAIL_ICON_ONLY_STORAGE_KEY } from '../../layout/constants';
import { useRailContext } from '../../layout/providers/RailProvider';
import type { TSendEvent } from '../../providers/EventProvider';
import { useWorkspaces, CreatorType } from '../../providers/WorkspaceProvider';
import type { TProductKey } from '../../types';
import { ProductKey } from '../../types';
import useProductUrls from '../../utils/useProductUrls';
import {
  TempAdsFillIcon,
  TempAdsIcon,
  TempFinanceFillIcon,
  TempFinanceIcon,
  TempUpdatesFillIcon,
  TempUpdatesIcon,
} from '../icons/TempNavIcons';
import useRailStyles from './Rail.styles';
import RailHeader from './RailHeader';
import RailItem from './RailItem';
import SidebarToggleTooltip from './SidebarToggleTooltip';

const FINANCES_PATHS = [
  '/dashboard/devex',
  '/dashboard/transactions',
  '/dashboard/account-information',
  '/dashboard/billing',
  '/dashboard/payments',
  '/dashboard/revenue-share-agreements',
  '/dashboard/group/payouts',
  '/dashboard/group/revenue-share-agreements',
];

type TPrimaryRailContentProps = {
  sendEvent: TSendEvent;
  openStudio: VoidFunction;
  login: VoidFunction;
  pathname: string;
  isAuth: boolean;
  isLoading: boolean;
};

export const PrimaryRailContent: React.FC<TPrimaryRailContentProps> = ({
  pathname,
  isAuth,
  isLoading,
  openStudio,
  sendEvent,
  login,
}) => {
  const {
    cx,
    classes: {
      railContainer,
      railContainerCompact,
      railContainerIconOnly,
      railContainerTransition,
      labelsRailContainer,
    },
  } = useRailStyles();
  const {
    classes: { scroll },
  } = useScrollStyles();

  const {
    iconOnly,
    primaryRailCompact,
    drawerVariant,
    allToolsOpen,
    learnOpen,
    isReady,
    shouldAnimate,
    setIconOnly,
    setPrimaryRailCompact,
    setLearnOpen,
    setAllToolsOpen,
    setPrimaryRailOpen,
  } = useRailContext();

  const compact = primaryRailCompact || iconOnly;

  const { currentProduct, enableAdsManager } = useNavigationConfigs();
  const {
    currentWorkspace: { creatorType },
  } = useWorkspaces();

  const { translate } = useTranslation();
  const hideStudio = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { Dashboard, Store, Forum, Ads, Roblox, Documentation } = useProductUrls();

  const isOnDocsite = ['Documentation', 'Assistant'].includes(currentProduct);

  const selectItem = useCallback(
    (event: string) => {
      sendEvent(clickRailEventModel(event));
      if (drawerVariant === 'temporary' && event !== 'Learn') {
        setPrimaryRailOpen(false);
      }

      if (event === 'Learn') {
        if (isOnDocsite) {
          setLearnOpen(true);
        }
      } else {
        setLearnOpen(false);
      }
    },
    [drawerVariant, sendEvent, setLearnOpen, setPrimaryRailOpen, isOnDocsite],
  );

  const active = useMemo(() => {
    if (learnOpen) {
      return 'Documentation';
    }

    if (pathname.startsWith(Dashboard.updates)) {
      return ProductKey.Updates;
    }

    if (currentProduct === ProductKey.CreatorDashboard) {
      if (pathname.startsWith(Dashboard.creations)) {
        return 'Creations';
      }

      if (pathname.startsWith(Dashboard.analytics)) {
        return 'Analytics';
      }

      if (FINANCES_PATHS.includes(pathname)) {
        return 'Finances';
      }

      if (pathname.startsWith(Dashboard.collaborations)) {
        return 'Collaboration';
      }
    }

    const productPaths: TProductKey[] = [
      ProductKey.Home,
      ProductKey.Documentation,
      ProductKey.Store,
      ProductKey.Forum,
      ProductKey.Advertise,
      ProductKey.Updates,
      ProductKey.Talent,
    ];

    if (enableAdsManager) {
      productPaths.push(ProductKey.Advertise);
    }

    if (productPaths.includes(currentProduct)) {
      return currentProduct;
    }

    return null;
  }, [
    learnOpen,
    currentProduct,
    enableAdsManager,
    pathname,
    Dashboard.creations,
    Dashboard.analytics,
    Dashboard.collaborations,
    Dashboard.updates,
  ]);

  if (isLoading) {
    return (
      <Grid
        classes={{
          root: cx(scroll, railContainer, {
            [railContainerTransition]: isReady,
            [railContainerCompact]: compact && !iconOnly,
            [railContainerIconOnly]: iconOnly,
            [labelsRailContainer]: compact,
          }),
        }}>
        <RailHeader
          compact={compact}
          icon={<RobloxIcon />}
          label={translate('Label.Creator')}
          onClick={() => selectItem('Header')}
          href={Dashboard.home}
        />
      </Grid>
    );
  }

  const onSidebarToggleClick = () => {
    const next = !iconOnly;
    sendEvent(clickNavPrimaryRailCollapseEventModel(next ? 'collapse' : 'expand'));
    if (!next) {
      setPrimaryRailCompact(false);
    }
    setIconOnly(next);
    localStorage.setItem(RAIL_ICON_ONLY_STORAGE_KEY, String(next));
  };

  return (
    <Grid
      classes={{
        root: cx(scroll, railContainer, {
          [railContainerTransition]: isReady,
          [railContainerCompact]: compact && !iconOnly,
          [railContainerIconOnly]: iconOnly,
          [labelsRailContainer]: compact,
        }),
      }}>
      <RailHeader
        compact={compact}
        enableAnimation={isReady}
        icon={<RobloxIcon />}
        label={translate('Label.Creator')}
        onClick={() => selectItem('Header')}
        href={Dashboard.home}
      />
      {isAuth && <WorkplaceSelector collapsed={compact} />}
      <RailItem
        enableAnimation={isReady && shouldAnimate}
        compact={compact}
        icon={<BuilderHomeIcon />}
        active={active === 'Home'}
        activeIcon={<BuilderHomeFillIcon />}
        label={translate('Heading.Home')}
        onClick={() => selectItem('Home')}
        href={Dashboard.home}
      />
      {isAuth && (
        <RailItem
          enableAnimation={isReady && shouldAnimate}
          compact={compact}
          icon={<Icon name='icon-regular-folder' size='Medium' />}
          activeIcon={<Icon name='icon-filled-folder' size='Medium' />}
          active={active === 'Creations'}
          label={translate('Heading.Creations')}
          onClick={() => selectItem('Creations')}
          href={Dashboard.creations}
        />
      )}
      <RailItem
        enableAnimation={isReady && shouldAnimate}
        compact={compact}
        icon={<Icon name='icon-regular-book-open' size='Medium' />}
        activeIcon={<Icon name='icon-filled-book-open' size='Medium' />}
        active={active === 'Documentation'}
        label={translate('Heading.Learn')}
        onClick={() => selectItem('Learn')}
        href={Documentation.home}
      />
      <RailItem
        enableAnimation={isReady && shouldAnimate}
        compact={compact}
        icon={<Icon name='icon-regular-shopping-basket' size='Medium' />}
        activeIcon={<Icon name='icon-filled-shopping-basket' size='Medium' />}
        active={active === 'Store'}
        label={translate('Heading.Store')}
        onClick={() => selectItem('Store')}
        href={Store.home}
      />
      <RailItem
        enableAnimation={isReady && shouldAnimate}
        compact={compact}
        icon={<BuilderChatSideIcon />}
        activeIcon={<BuilderChatSideFillIcon />}
        active={active === 'Forum'}
        label={translate('Heading.Forums')}
        onClick={() => selectItem('Forum')}
        href={Forum.home}
      />
      <RailItem
        enableAnimation={isReady && shouldAnimate}
        compact={compact}
        icon={<TempUpdatesIcon />}
        activeIcon={<TempUpdatesFillIcon />}
        active={active === ProductKey.Updates}
        label={translate('Heading.Updates')}
        onClick={() => selectItem(ProductKey.Updates)}
        href={Dashboard.updates}
      />
      {isAuth && (
        <>
          {(!compact || iconOnly) && (
            <div className='padding-y-small width-full'>
              <Divider />
            </div>
          )}
          <RailItem
            enableAnimation={isReady && shouldAnimate}
            compact={compact}
            icon={<TempFinanceIcon />}
            activeIcon={<TempFinanceFillIcon />}
            active={active === 'Finances'}
            label={translate('Heading.Finances')}
            onClick={() => selectItem('Finances')}
            href={Dashboard.finances}
          />
          <RailItem
            enableAnimation={isReady && shouldAnimate}
            compact={compact}
            icon={<Icon name='icon-regular-chart-three-vertical-bars' size='Medium' />}
            activeIcon={<Icon name='icon-filled-chart-three-vertical-bars' size='Medium' />}
            active={active === 'Analytics'}
            label={translate('Title.Analytics')}
            onClick={() => selectItem('Analytics')}
            href={Dashboard.analytics}
          />
          {creatorType === CreatorType.Group && (
            <RailItem
              enableAnimation={isReady && shouldAnimate}
              compact={compact}
              icon={<Icon name='icon-regular-two-people' size='Medium' />}
              activeIcon={<Icon name='icon-filled-two-people' size='Medium' />}
              active={active === 'Collaboration'}
              label={translate('Heading.Collaboration')}
              onClick={() => selectItem('Collaboration')}
              href={Dashboard.groupProfile}
            />
          )}
          <RailItem
            enableAnimation={isReady && shouldAnimate}
            compact={compact}
            active={active === ProductKey.Advertise}
            icon={<TempAdsIcon />}
            activeIcon={<TempAdsFillIcon />}
            label={translate('Heading.Ads')}
            onClick={() => selectItem('Ads')}
            href={Ads.home}
          />
          {(!compact || iconOnly) && (
            <div className='padding-y-small width-full'>
              <Divider />
            </div>
          )}
        </>
      )}
      {isAuth || compact ? (
        <RailItem
          enableAnimation={isReady && shouldAnimate}
          compact={compact}
          icon={<Icon name='icon-regular-three-dots-horizontal' size='Medium' />}
          label={translate('Heading.AllTools')}
          onClick={() => {
            if (isAuth) {
              sendEvent(clickRailEventModel('AllTools'));
              setAllToolsOpen(!allToolsOpen);
            } else {
              login();
              sendEvent(clickRailEventModel('AllToolsLogin'));
            }
          }}
        />
      ) : (
        <Button
          variant='contained'
          color='secondary'
          onClick={() => {
            sendEvent(clickRailEventModel('AllToolsLogin'));
            login();
          }}>
          <Typography variant='smallLabel2' noWrap>
            {translate('Action.LogInAllTools')}
          </Typography>
        </Button>
      )}
      <RailItem
        enableAnimation={isReady && shouldAnimate}
        bottom
        compact={compact}
        icon={<RobloxIcon />}
        label={translate('Label.RobloxWebsite')}
        onClick={() => selectItem('RobloxWebsite')}
        href={Roblox.home}
      />
      {!hideStudio && (
        <RailItem
          enableAnimation={isReady && shouldAnimate}
          compact={compact}
          icon={<StudioIcon />}
          label={translate('Heading.Studio')}
          onClick={() => {
            selectItem('studio');
            openStudio();
          }}
        />
      )}
      {drawerVariant === 'persistent' && (
        <SidebarToggleTooltip enabled collapsed={iconOnly}>
          <RailItem
            enableAnimation={isReady && shouldAnimate}
            compact={compact}
            icon={
              <Icon
                name={iconOnly ? 'icon-regular-sidebar' : 'icon-filled-sidebar'}
                size='Medium'
              />
            }
            label={translate(
              iconOnly && !shouldAnimate ? 'Label.ShowSidebar' : 'Label.HideSidebar',
            )}
            onClick={onSidebarToggleClick}
          />
        </SidebarToggleTooltip>
      )}
    </Grid>
  );
};

export default PrimaryRailContent;
