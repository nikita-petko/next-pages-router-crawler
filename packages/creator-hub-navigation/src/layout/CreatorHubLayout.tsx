import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import {
  NavigationSearchProvider,
  SearchContainer,
  SearchContainerRaw,
  SearchConfigProvider,
} from '@rbx/creator-hub-search';
import { Grid, makeStyles } from '@rbx/ui';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import PrimaryRail from '../primaryRail/PrimaryRail';
import EventProvider from '../providers/EventProvider';
import WorkspaceProvider from '../providers/WorkspaceProvider';
import getRobloxSiteDomain from '../utils/getRobloxSiteDomain';
import Header from './components/Header';
import PageContent from './components/PageContent';
import { CONTENT_GRID_AREA, HEADER_GRID_AREA, PRIMARY_RAIL_GRID_AREA } from './constants';
import { useRailContext } from './providers/RailProvider';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'grid',
    height: '100vh',
    width: '100vw',
    gridTemplateAreas: `
      "${PRIMARY_RAIL_GRID_AREA} ${HEADER_GRID_AREA}"
      "${PRIMARY_RAIL_GRID_AREA} ${CONTENT_GRID_AREA}"
    `,
    gridTemplateRows: 'auto 1fr',
    gridTemplateColumns: 'auto 1fr',
  },
}));

type LayoutComponents = {
  Header: typeof Header;
  PageContent: typeof PageContent;
  Rail: typeof PrimaryRail;
};

export const CreatorHubLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {
    classes: { container },
  } = useStyles();
  const pathname = usePathname();
  const { drawerVariant, setPrimaryRailOpen, setAllToolsOpen } = useRailContext();

  useEffect(() => {
    if (drawerVariant === 'temporary') {
      setPrimaryRailOpen(false);
    }
    setAllToolsOpen(false);
  }, [setPrimaryRailOpen, pathname, drawerVariant, setAllToolsOpen]);

  return <Grid classes={{ root: container }}>{children}</Grid>;
};

/**
 * Inner component that has access to navigation configs and conditionally renders search
 */
const CreatorHubLayoutInner: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { useStaticTranslations, target, environment, currentProduct, creatorHubSearchIxpParams } =
    useNavigationConfigs();

  // Use SearchContainerRaw when app uses StaticTranslationProvider (e.g., doc-site-ssr)
  // SearchContainerRaw doesn't use withTranslation HOC, so it works with pre-loaded translations
  const SearchComponent = useStaticTranslations ? SearchContainerRaw : SearchContainer;

  // Compute the domain using navigation's existing utility
  const robloxSiteDomain = getRobloxSiteDomain(target, environment);

  return (
    <SearchConfigProvider
      robloxSiteDomain={robloxSiteDomain}
      currentProduct={currentProduct}
      creatorHubSearchIxpParams={creatorHubSearchIxpParams}>
      <NavigationSearchProvider>
        <CreatorHubLayout>
          <SearchComponent />
          {children}
        </CreatorHubLayout>
      </NavigationSearchProvider>
    </SearchConfigProvider>
  );
};

const CreatorHubLayoutContainer: React.FC<React.PropsWithChildren> & LayoutComponents = ({
  children,
}) => {
  return (
    <EventProvider>
      <WorkspaceProvider>
        <CreatorHubLayoutInner>{children}</CreatorHubLayoutInner>
      </WorkspaceProvider>
    </EventProvider>
  );
};

CreatorHubLayoutContainer.Header = Header;
CreatorHubLayoutContainer.PageContent = PageContent;
CreatorHubLayoutContainer.Rail = PrimaryRail;

export default CreatorHubLayoutContainer;
