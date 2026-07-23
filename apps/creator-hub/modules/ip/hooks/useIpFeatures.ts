import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import useCurrentAccount from '../rights/hooks/useCurrentAccount';
import type { IpSettings } from '../types';

const featureManagerIP = new NavigationFeatureManager<IpSettings>();

const RIGHTS_MANAGER_KEY = 'ip-rm';

/** The (secondary) menu for Intellectual Properties */
const menuItems: Feature<IpSettings>[] = [
  {
    key: RIGHTS_MANAGER_KEY,
    nameKey: 'Heading.RightsManager',
    subFeatures: [
      {
        key: 'claims',
        nameKey: 'Heading.Claims',
        path: '/dashboard/rights-manager/claims',
        isEnabledOnSettings: (settings) =>
          settings?.enableClaimsAndDisputes === true &&
          // designs calls for this page to be shown at all times,
          // but currently the page doesn't work unless you have RM account
          !!settings?.rightsAccountStatus,
      },
      {
        key: 'removal-requests',
        nameKey: 'Heading.RemovalRequests',
        path: '/dashboard/rights-manager/removal-requests',
        isEnabledOnSettings: (settings) =>
          settings?.enableClaimsAndDisputes !== true &&
          // designs calls for this page to be shown at all times,
          // but currently the page doesn't work unless you have RM account
          !!settings?.rightsAccountStatus,
      },
      {
        key: 'matches',
        nameKey: 'Heading.Matches',
        path: '/dashboard/rights-manager/matches',
        isEnabledOnSettings: (settings) =>
          settings?.enableMatchesPage === true &&
          settings?.rightsAccountStatus === AccountStatusEnum.Verified,
      },
    ],
  },
  {
    key: 'creator-agreements',
    nameKey: 'Heading.Licenses',
    path: '/dashboard/license-manager/creator-agreements',
    isEnabledOnSettings: (settings) => !settings?.enableAgreementManager,
  },
  {
    key: 'licenses-agreements',
    nameKey: 'Heading.AgreementsAndLicenses',
    isEnabledOnSettings: (settings) => settings?.enableAgreementManager === true,
    subFeatures: [
      {
        key: 'licenses',
        nameKey: 'Heading.Licenses',
        path: '/dashboard/license-manager/licenses',
      },
      {
        key: 'am-matches',
        nameKey: 'Heading.Matches',
        path: '/dashboard/license-manager/matches',
      },
    ],
  },
  {
    key: 'IPLibrary',
    nameKey: 'Heading.IPLibrary',
    path: '/dashboard/ip/ip-library',
    isEnabledOnSettings: (settings) => settings?.rightsAccountStatus === AccountStatusEnum.Verified,
  },
  {
    key: 'ip-profile',
    nameKey: 'Heading.RightsProfile',
    path: '/dashboard/rights-manager/account',
    isEnabledOnSettings: (settings) =>
      !!settings?.rightsAccountStatus &&
      settings?.rightsAccountStatus !== AccountStatusEnum.Unverified,
  },
  {
    key: 'ip-rm-unregistered',
    nameKey: 'Heading.Registration',
    path: '/dashboard/rights-manager/register',
    isEnabledOnSettings: (settings) =>
      !settings?.rightsAccountStatus ||
      settings?.rightsAccountStatus === AccountStatusEnum.Unverified,
  },
];
menuItems.forEach((menuItem) => {
  featureManagerIP.addFeature(menuItem);
});

/**
 * The settings required for the nav-items (e.g. features) to evaluated.
 */
const useIpNavSettings = () => {
  const { params } = useIXPParameters(IXPLayers.RightsManager, {
    restoreInitialValueFromCache: true,
  });
  const currentGroup = useCurrentGroup();
  const { accountStatus: rightsAccountStatus, isLoading, features } = useCurrentAccount();

  const ipNavSettings: IpSettings = useMemo(() => {
    return {
      ...params,
      isLoading,
      groupId: currentGroup?.id,
      rightsAccountStatus,
      enableAgreementManager: features?.enableAgreements,
      enableMatchesPage: // All of these are in the matches page:
        features?.enableTopExperienceMatch || // experience owners can see matches
        !!params?.enableOnDemandSearch || // old on-demand search, search for anything
        !!params?.enableIpContentSearch, // new ip content search, search only for ip content
      enableClaimsAndDisputes: features?.enableClaimsAndDisputes,
    };
  }, [params, isLoading, currentGroup?.id, rightsAccountStatus, features]);

  return ipNavSettings;
};

/**
 * Find the feature with the shortest path that includes the current pathname.
 */
const matchBestAvailableFeature = (flatFeatures: Feature<IpSettings>[], pathname: string) => {
  let bestMatch: Feature<IpSettings> | undefined;
  flatFeatures.forEach((feature) => {
    if (feature.path && pathname.startsWith(feature.path)) {
      if (!bestMatch || (bestMatch.path && bestMatch.path.length > feature.path.length)) {
        bestMatch = feature;
      }
    }
  });
  return bestMatch;
};

const getFilteredAndOverriddenFeatures = (settings: IpSettings) => {
  const allFeatures = featureManagerIP.getAllFeatures();
  const features = featureManagerIP.filterDisabledFeatures(allFeatures, settings);
  return featureManagerIP.overrideFeatures(features, settings.groupId);
};

/**
 * Generate the features (e.g. menu items) that are used by the IP secondary navigation
 */
const useIpFeatures = (enableIA = false) => {
  const router = useRouter();
  const settings = useIpNavSettings();

  return useMemo(() => {
    if (settings.isLoading) {
      return {
        features: [],
        activeFeature: undefined,
        defaultExpanded: undefined,
      };
    }

    let overriddenFeatures = getFilteredAndOverriddenFeatures(settings);

    // filter out parents with no children
    overriddenFeatures = overriddenFeatures.filter(
      (feature) => !feature.subFeatures || (feature.subFeatures && feature.subFeatures.length),
    );

    /*
    UX calls for a few special cases around the Rights Manager parent item.

    If: 
    - RM is the only parent item in the menu (e.g. no AM)
    or
    - RM only has one child

    then we'll flatten the RM sub-items into the top level.
    */
    const parentCount = overriddenFeatures.filter(
      (feature) => feature.subFeatures && feature.subFeatures.length,
    ).length;

    const rightsManagerParent = overriddenFeatures.find(
      (feature) => feature.key === RIGHTS_MANAGER_KEY,
    );

    if (
      rightsManagerParent &&
      (parentCount === 1 || rightsManagerParent.subFeatures?.length === 1)
    ) {
      overriddenFeatures = overriddenFeatures.flatMap((feature) => {
        if (feature === rightsManagerParent && feature.subFeatures?.length) {
          return feature.subFeatures;
        }
        return feature;
      });
    }

    const flatFeatures = NavigationFeatureManager.flattenFeatures(overriddenFeatures);

    const activeFeature =
      flatFeatures.find((feature) =>
        NavigationFeatureManager.matchFeaturePath(feature, router.pathname, router.query),
      ) ?? matchBestAvailableFeature(flatFeatures, router.pathname);

    // expand all expendable items by default when we show grouped items
    const defaultExpanded = overriddenFeatures
      .filter((item) => item.subFeatures?.length)
      .map((item) => `${enableIA ? '' : 'parent-'}${item.key}`);

    return {
      features: overriddenFeatures,
      flatFeatures,
      activeFeature,
      defaultExpanded,
    };
  }, [enableIA, router.pathname, router.query, settings]);
};

export default useIpFeatures;
