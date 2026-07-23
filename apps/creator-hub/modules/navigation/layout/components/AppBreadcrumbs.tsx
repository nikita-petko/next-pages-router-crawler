import type { FunctionComponent, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HubMeta, buildBreadcrumb } from '@rbx/creator-hub-history';
import { CurrentProductName } from '@rbx/creator-hub-navigation';
import { withTranslation } from '@rbx/intl';
import { Breadcrumbs, Grid, Link as UILink, Typography, useMediaQuery } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { BreadcrumbItemDetails } from '../constants/BreadcrumbsItemConstants';
import { RouterParseItemToBreadcrumbItemDetails } from '../constants/BreadcrumbsItemConstants';
import useAppBreadcrumbsData from '../hooks/useAppBreadcrumbsData';
import useTopNavigationSidebarDrawer from '../hooks/useTopNavigationSidebarDrawer';
import {
  collectBreadcrumbItems,
  computeSeoTitle,
  getExperienceHubMetaProps,
} from '../utils/breadcrumbTitleUtils';
import useAppBreadcrumbStyles from './AppBreadcrumbs.styles';

const breadcrumbMaxItems = 8;
const compactBreadcrumbMaxItems = 3;

const itemPathCheck = (pathName: string, itemPath?: string) => {
  if (itemPath) {
    const currentPath = pathName.replaceAll(/\[[^\]]*?\]/g, '');
    const isSameAsCurrentPath = currentPath === itemPath?.replaceAll(/\d+/g, '');
    return isSameAsCurrentPath ? undefined : itemPath;
  }
  return itemPath;
};

const AppBreadcrumbs: FunctionComponent<{ inLayoutHeader?: boolean }> = ({
  inLayoutHeader = false,
}) => {
  const { pathname } = useRouter();
  const {
    classes: {
      linkStyle,
      compactBreadCrumbLinkStyle,
      breadcrumb,
      breadcrumbBottomSpace,
      compactBreadCrumb,
    },
  } = useAppBreadcrumbStyles();
  const { insideTopNavigationDrawer } = useTopNavigationSidebarDrawer();
  const isMobileView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { gameDetails } = useCurrentGame();

  const path = useMemo(() => pathname.split('/').filter((part) => !!part), [pathname]);

  // NOTE (@mbae, 01/22/24): The translate function on displayNameParam is stale on startup
  // You should properly handle the case where the translate function doesn't return
  // a non-empty string.
  const { itemNameMapping, pathLinkParams, displayNameParam } = useAppBreadcrumbsData();

  const createBreadcrumbContent = useCallback(
    (name: string, link?: string) => {
      if (insideTopNavigationDrawer) {
        if (link) {
          return (
            // oxlint-disable-next-line typescript-eslint/no-deprecated -- migrating off legacyBehavior tracked separately
            <Link href={link} passHref key={name} legacyBehavior>
              <UILink underline='always' color='inherit'>
                <Typography color='primary' variant='largeLabel1'>
                  {name}
                </Typography>
              </UILink>
            </Link>
          );
        }
        return (
          <Typography color='primary' variant='largeLabel1' key={name}>
            {name}
          </Typography>
        );
      }
      if (link) {
        return (
          // oxlint-disable-next-line typescript-eslint/no-deprecated -- migrating off legacyBehavior tracked separately
          <Link href={link} passHref key={name} legacyBehavior>
            <UILink classes={{ root: linkStyle }}>{name}</UILink>
          </Link>
        );
      }
      return (
        <Typography color='secondary' key={name}>
          {name}
        </Typography>
      );
    },
    [insideTopNavigationDrawer, linkStyle],
  );

  // For the item which has corresponding id, it needs to show both the itemType and itemName in the breadcrumbs
  // e.g badge --> /Associated Items/<Badge Name>
  const handleItemWithId = useCallback(
    (currentItemDetail: BreadcrumbItemDetails) => {
      const itemType = currentItemDetail.parentItemTypeName
        ? RouterParseItemToBreadcrumbItemDetails[currentItemDetail.parentItemTypeName]
        : null;
      const itemName = itemNameMapping[currentItemDetail.breadcrumbType];
      const itemPath = currentItemDetail.getLinkPath?.(pathLinkParams);
      const shouldHasItemPath =
        itemType !== null ? currentItemDetail.breadcrumbType !== itemType.breadcrumbType : true;

      return [
        itemType
          ? createBreadcrumbContent(
              itemType.displayName(displayNameParam),
              itemPathCheck(pathname, itemType.getLinkPath?.(pathLinkParams)),
            )
          : null,
        itemName
          ? createBreadcrumbContent(
              itemName,
              shouldHasItemPath ? itemPathCheck(pathname, itemPath) : undefined,
            )
          : null,
      ];
    },
    [itemNameMapping, pathLinkParams, createBreadcrumbContent, displayNameParam, pathname],
  );

  const breadcrumbItems = useMemo(
    () =>
      collectBreadcrumbItems(
        path,
        RouterParseItemToBreadcrumbItemDetails,
        displayNameParam,
        itemNameMapping,
      ),
    [path, displayNameParam, itemNameMapping],
  );

  const title = useMemo(() => computeSeoTitle(breadcrumbItems), [breadcrumbItems]);
  const experienceMetaProps = useMemo(
    () => getExperienceHubMetaProps(pathname, gameDetails),
    [pathname, gameDetails],
  );

  const { breadcrumbsContents, breadcrumbNames } = useMemo(() => {
    const getBreadCrumbName = (breadcrumbDetails: BreadcrumbItemDetails) => {
      if (breadcrumbDetails.withId) {
        return (
          itemNameMapping[breadcrumbDetails.breadcrumbType] ??
          breadcrumbDetails.displayName(displayNameParam)
        );
      }
      return breadcrumbDetails.displayName(displayNameParam);
    };

    const items = path
      .map((key) => ({ key, breadcrumbDetails: RouterParseItemToBreadcrumbItemDetails[key] }))
      .filter((item) => item.breadcrumbDetails);

    if (inLayoutHeader && isMobileView) {
      if (items.length === 0) {
        return { breadcrumbsContents: [], breadcrumbNames: [] };
      }
      const { key, breadcrumbDetails } = items[0];
      const names = items.map(({ breadcrumbDetails: details }) => getBreadCrumbName(details));
      const breadcrumbPath = breadcrumbDetails.getLinkPath?.(pathLinkParams);
      const breadcrumbItem = (
        <Typography
          color='primary'
          key={key}
          aria-current='page'
          variant={isMobileView && inLayoutHeader ? 'h3' : undefined}>
          {getBreadCrumbName(breadcrumbDetails)}
        </Typography>
      );

      if (breadcrumbPath) {
        return {
          breadcrumbsContents: [
            <Link href={breadcrumbPath} key={key} className={compactBreadCrumbLinkStyle}>
              {breadcrumbItem}
            </Link>,
          ],
          breadcrumbNames: names,
        };
      }
      return { breadcrumbsContents: [breadcrumbItem], breadcrumbNames: names };
    }

    const { contents, names } = items.reduce(
      (acc, { key, breadcrumbDetails: currentItem }, currentIndex) => {
        if (!currentItem) {
          return acc;
        }

        // Last node is always active (non-clickable)
        if (currentIndex === items.length - 1) {
          const name = getBreadCrumbName(currentItem);
          // Skip a trailing crumb that resolves to an empty name
          if (!name) {
            return acc;
          }
          return {
            contents: [
              ...acc.contents,
              <Typography
                color='primary'
                key={key}
                aria-current='page'
                variant={isMobileView && inLayoutHeader ? 'h3' : undefined}>
                {name}
              </Typography>,
            ],
            names: [...acc.names, name],
          };
        }

        // For items with corresponding id (e.g. games, badges...)
        if (currentItem.withId) {
          const parentDetail = currentItem.parentItemTypeName
            ? RouterParseItemToBreadcrumbItemDetails[currentItem.parentItemTypeName]
            : null;
          const itemName = itemNameMapping[currentItem.breadcrumbType];
          return {
            contents: acc.contents.concat(handleItemWithId(currentItem)),
            names: [
              ...acc.names,
              ...(parentDetail ? [parentDetail.displayName(displayNameParam)] : []),
              ...(itemName ? [itemName] : []),
            ],
          };
        }

        const displayName = currentItem.displayName(displayNameParam);
        if (!displayName) {
          return acc;
        }

        return {
          contents: [
            ...acc.contents,
            createBreadcrumbContent(displayName, currentItem.getLinkPath?.(pathLinkParams)),
          ],
          names: [...acc.names, displayName],
        };
      },
      { contents: [] as ReactNode[], names: [] as string[] },
    );

    return { breadcrumbsContents: contents, breadcrumbNames: names };
  }, [
    path,
    inLayoutHeader,
    isMobileView,
    displayNameParam,
    itemNameMapping,
    pathLinkParams,
    compactBreadCrumbLinkStyle,
    createBreadcrumbContent,
    handleItemWithId,
  ]);

  const hubTitle = useMemo(() => breadcrumbNames[breadcrumbNames.length - 1], [breadcrumbNames]);

  const hubBreadcrumb = useMemo(() => buildBreadcrumb(...breadcrumbNames), [breadcrumbNames]);

  const pageHead = title && (
    <HubMeta
      title={hubTitle}
      breadcrumb={hubBreadcrumb}
      seoTitle={title}
      {...experienceMetaProps}
    />
  );

  if (isMobileView) {
    return (
      <Grid className={inLayoutHeader ? undefined : compactBreadCrumb}>
        {pageHead}
        <Breadcrumbs
          id='navigation-breadcrumbs'
          maxItems={compactBreadcrumbMaxItems}
          aria-label='breadcrumb'>
          {/* If the breadcrumbs only have one item, not to display on the page */}
          {(inLayoutHeader || breadcrumbsContents.length > 1) && breadcrumbsContents}
        </Breadcrumbs>
      </Grid>
    );
  }
  if (insideTopNavigationDrawer) {
    // when renders inside top navigation drawer, always prefix with "Dashboard"
    // product name, and drop the last page title in breadcrumb
    // TODO (yanzhuang@ 20221119): CRF-1860, update breadcrumb related e2e test
    // in new navigation setup
    return (
      <Grid>
        {pageHead}
        <Breadcrumbs maxItems={compactBreadcrumbMaxItems} aria-label='breadcrumb'>
          <Typography key='product-name' color='primary' variant='largeLabel1'>
            <CurrentProductName />
          </Typography>
          {breadcrumbsContents.slice(0, -1)}
        </Breadcrumbs>
      </Grid>
    );
  }
  return (
    <Grid
      className={`${breadcrumb} ${
        breadcrumbsContents.length > 1 && !inLayoutHeader ? breadcrumbBottomSpace : ''
      }`}>
      {pageHead}
      <Breadcrumbs
        id='navigation-breadcrumbs'
        maxItems={breadcrumbMaxItems}
        aria-label='breadcrumb'>
        {/* If the breadcrumbs only have one item, not to display on the page */}
        {breadcrumbsContents.length > 1 && breadcrumbsContents}
      </Breadcrumbs>{' '}
    </Grid>
  );
};

export default withTranslation(AppBreadcrumbs, [
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
  TranslationNamespace.Navigation,
  TranslationNamespace.MarketplaceOnboarding,
  TranslationNamespace.PublicPublish,
  TranslationNamespace.ExperienceAlerts,
  TranslationNamespace.PlayerFeedback,
  TranslationNamespace.DevEx,
]);
