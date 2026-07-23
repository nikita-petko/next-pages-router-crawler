import { useEffect, useState } from 'react';
import type { TFooterBehavior } from '@rbx/creator-hub-navigation';
import { Locale, toLocaleCode } from '@rbx/intl';
import guacClient from '@modules/clients/guac';
import localeClient from '@modules/clients/locale';

const DEFAULT_FOOTER_BEHAVIOR: TFooterBehavior = {
  showGermanyOnlyLink: false,
};

export default function useFooterBehavior(): TFooterBehavior {
  const [footerBehavior, setFooterBehavior] = useState<TFooterBehavior>(
    () => DEFAULT_FOOTER_BEHAVIOR,
  );

  useEffect(() => {
    /**
     * * NOTE(@zwang, 01/29/24): logic here is to cover both UX and compliance considerations:
     * * 1. Default to NOT showing the link since it's better UX for majority of the users & guests
     * * 2. Query GUAC to check if it's a German user
     * * 3. If request in 2 fails, then try to query if user's locale is German
     * * 4. If both 2 & 3 fails, show the link no matter what to stay on the safer side
     */
    async function fetchFooterBehavior() {
      try {
        const response = await guacClient.loadBehavior<TFooterBehavior>('creator-hub-footer-link');
        setFooterBehavior(response);
      } catch {
        try {
          const { generalExperience } =
            await localeClient.getUserLocalizationLocusSupportedLocales();
          const robloxLocale = generalExperience?.locale;

          if (typeof robloxLocale !== 'undefined' && toLocaleCode(robloxLocale) === Locale.German) {
            setFooterBehavior({ showGermanyOnlyLink: true });
          }
        } catch {
          setFooterBehavior({ showGermanyOnlyLink: true });
        }
      }
    }

    fetchFooterBehavior();
  }, []);

  return footerBehavior;
}
