import { useMemo } from 'react';
import { Locale, toLocaleCode } from '@rbx/intl';
import { youTubeLink as youTubeDetails } from '../footer/constants/links/private';
import type { TFooterBehavior } from '../footer/constants/type';
import useLoadFooterBehavior from '../queries/useGetLoadBehavior';
import useGetUserLocalizationLocusSupportedLocales from '../queries/useGetUserLocalizationLocusSupportedLocales';
import useProductUrls from '../utils/useProductUrls';
import useNavigationConfigs from './useNavigationConfigs';

const DEFAULT_FOOTER_BEHAVIOR: TFooterBehavior = {
  showGermanyOnlyLink: false,
};

export default function useFooterBehavior(): Required<TFooterBehavior> {
  const { currentProduct } = useNavigationConfigs();
  const { Dashboard, Roblox } = useProductUrls();
  const { data, isError: isBehaviorError } = useLoadFooterBehavior();
  const { data: supportedLocals, isError: isLocalError } =
    useGetUserLocalizationLocusSupportedLocales();

  /**
   * * NOTE(@zwang, 01/29/24): logic here is to cover both UX and compliance considerations:
   * * 1. Default to NOT showing the link since it's better UX for majority of the users & guests
   * * 2. Query GUAC to check if it's a German user
   * * 3. If request in 2 fails, then try to query if user's locale is German
   * * 4. If both 2 & 3 fails, show the link no matter what to stay on the safer side
   */
  return useMemo(() => {
    const isDocSite = ['Documentation', 'Assistant'].includes(currentProduct);
    const settingsLink = isDocSite ? Dashboard.creatorSettings : Roblox.accountSettings;
    const youTubeLink = isDocSite ? 'https://www.youtube.com/@RobloxLearn' : youTubeDetails.path;

    if (isBehaviorError && isLocalError) {
      return { showGermanyOnlyLink: true, youTubeLink, settingsLink };
    }

    if (data) {
      return { settingsLink, youTubeLink, ...data };
    }

    if (supportedLocals) {
      const robloxLocale = supportedLocals.generalExperience?.locale;
      return {
        settingsLink,
        youTubeLink,
        showGermanyOnlyLink:
          typeof robloxLocale !== 'undefined' && toLocaleCode(robloxLocale) === Locale.German,
      };
    }

    return { ...DEFAULT_FOOTER_BEHAVIOR, youTubeLink, settingsLink };
  }, [
    Dashboard.creatorSettings,
    Roblox.accountSettings,
    currentProduct,
    data,
    isBehaviorError,
    isLocalError,
    supportedLocals,
  ]);
}
