import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import {
  getAdsPath,
  getCreatorHubBasePathV2 as getCreatorHubBasePath,
  getDevForumBasePath,
  getRobloxSiteDomainV2,
} from './getBasePaths';
import isDashboard from './isDashboard';

const LOCALE_SLUG_REGEXP = /^[a-z]{2}-[a-z]{2}$/;

const useProductUrls = () => {
  const {
    target,
    robloxEnvironment: environment,
    currentProduct,
    enableAdsManager,
  } = useNavigationConfigs();
  const pathname = usePathname();

  return useMemo(() => {
    const isDocumentation = ['Documentation', 'Assistant'].includes(currentProduct);
    const baseUrl = getCreatorHubBasePath(target, environment);
    const adsPath = enableAdsManager ? `${baseUrl}advertise` : getAdsPath(environment);

    const urlLocale = pathname?.split('/')[1];
    const docSiteLocal = LOCALE_SLUG_REGEXP.test(urlLocale) ? `${urlLocale}/` : '';
    const creatorHubBasePath = isDashboard(currentProduct) ? '/' : baseUrl;
    const storeBasePath = currentProduct === 'Store' ? '/' : `${baseUrl}store/`;
    const talentBasePath = currentProduct === 'Talent' ? '/' : `${baseUrl}talent/`;
    const documentationBasePath = isDocumentation ? `/${docSiteLocal}` : `${baseUrl}docs/`;
    const forumBasePath = getDevForumBasePath(environment);
    const adsBasePath = currentProduct === 'Advertise' ? '/' : adsPath;
    const robloxBasePath = `https://${getRobloxSiteDomainV2(target, environment)}/`;

    return {
      Dashboard: {
        home: creatorHubBasePath,
        updates: `${creatorHubBasePath}updates`,
        finances: `${creatorHubBasePath}dashboard/devex`,
        creations: `${creatorHubBasePath}dashboard/creations`,
        collaborations: `${creatorHubBasePath}dashboard/group`,
        avatarItems: `${creatorHubBasePath}dashboard/creations?activeTab=HairAccessory`,
        developerItems: `${creatorHubBasePath}dashboard/creations?activeTab=Model`,
        apiKeys: `${creatorHubBasePath}dashboard/credentials`,
        oAuth: `${creatorHubBasePath}dashboard/credentials?activeTab=OAuthTab`,
        shareLinks: `${creatorHubBasePath}dashboard/creations?activeTab=ShareLink`,
        analytics: `${creatorHubBasePath}dashboard/analytics`,
        createGroups: `${creatorHubBasePath}dashboard/group/create`,
        groupMembers: `${creatorHubBasePath}dashboard/group/members`,
        groupActivityHistory: `${creatorHubBasePath}dashboard/group/activity-history`,
        groupRoles: `${creatorHubBasePath}dashboard/group/roles`,
        creatorSettings: `${creatorHubBasePath}settings/preferences`,
        devEx: `${creatorHubBasePath}dashboard/devex`,
        payouts: `${creatorHubBasePath}dashboard/transactions?paymentType=Payouts`,
        transactions: `${creatorHubBasePath}dashboard/transactions`,
        intellectualProperty: `${creatorHubBasePath}dashboard/ip`,
        translations: `${creatorHubBasePath}dashboard/translator-portal`,
        roadmap: `${creatorHubBasePath}roadmap`,
        groupProfile: `${creatorHubBasePath}dashboard/group/profile`,
        licenses: `${creatorHubBasePath}explore/licenses`,
        build: `${creatorHubBasePath}build`,
        groupModeration: `${creatorHubBasePath}dashboard/group/moderation`,
      },
      Store: {
        home: storeBasePath,
        models: `${storeBasePath}models`,
        plugins: `${storeBasePath}plugins`,
        audio: `${storeBasePath}audio`,
        decals: `${storeBasePath}decals`,
      },
      Talent: {
        home: talentBasePath,
      },
      Documentation: {
        home: documentationBasePath,
        // Assistant does not use locale path
        assistant: `${!isDocumentation ? `${baseUrl}docs` : ''}/assistant`,
        studio: `${documentationBasePath}studio`,
        engine: `${documentationBasePath}reference/engine`,
        cloud: `${documentationBasePath}cloud`,
        create: `${documentationBasePath}platform`,
        createExperiences: `${documentationBasePath}experiences`,
        createAvatar: `${documentationBasePath}avatar`,
        createAssets: `${documentationBasePath}assets`,
        createSamples: `${documentationBasePath}samples`,
        scaleAnalytics: `${documentationBasePath}production/analytics`,
        monetize: `${documentationBasePath}monetize`,
        newToRobloxGetStarted: `${documentationBasePath}get-started`,
        newToRobloxTutorials: `${documentationBasePath}tutorials`,
        communityCreatorPrograms: `${documentationBasePath}creator-programs`,
        communityEducators: `${documentationBasePath}education/educator-onboarding/landing`,
        communityGuidelinesAndPolicies: `${documentationBasePath}safety`,
      },
      Forum: {
        home: forumBasePath,
      },
      Ads: {
        home: adsBasePath,
      },
      Roblox: {
        home: robloxBasePath,
        accountSettings: `${robloxBasePath}my/account`,
        sponsoredItems: `${robloxBasePath}sponsorships/list`,
        getGroupSponsoredItems: (id: number | string) =>
          `${robloxBasePath}sponsorships/list/group/${id}`,
        getCommunitiesUrl: (id: number | string) => `${robloxBasePath}communities/${id}`,
      },
    };
  }, [currentProduct, target, environment, enableAdsManager, pathname]);
};

export default useProductUrls;
