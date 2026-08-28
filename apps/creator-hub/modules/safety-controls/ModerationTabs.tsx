import type { FC, PropsWithChildren } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { enhancedAntiCheatAccess } from '@generated/flags/antiCheat';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

export enum ModerationTab {
  Bans = 'bans',
  AntiCheat = 'antiCheat',
}

const AntiCheatTabValue: string = ModerationTab.AntiCheat;

type ModerationTabsProps = PropsWithChildren<{
  activeTab: ModerationTab;
}>;

const ModerationTabs: FC<ModerationTabsProps> = ({ activeTab, children }) => {
  const router = useRouter();
  const { gameDetails } = useCurrentGame();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { ready: isFlagReady, value: isAntiCheatEnabled } = useFlag(enhancedAntiCheatAccess, {
    universeId: gameDetails?.id ?? 0,
  });

  const handleTabChange = useCallback(
    (tab: string) => {
      const universeId = gameDetails?.id;
      if (!universeId) {
        return;
      }
      const path =
        tab === AntiCheatTabValue
          ? `/dashboard/creations/experiences/${universeId}/safety/anti-cheat`
          : `/dashboard/creations/experiences/${universeId}/safety/bans`;
      void router.push(path);
    },
    [gameDetails?.id, router],
  );

  if (!isFlagReady || !isAntiCheatEnabled) {
    return children;
  }

  const antiCheatLabel = tPendingTranslation(
    'Anti-Cheat',
    'Navigation tab label that opens the Anti-Cheat page within the Creator Hub experience settings. “Anti-Cheat” is the name of the settings category.',
    translationKey('Tab.AntiCheat', TranslationNamespace.AntiCheat),
  );
  const bansLabel = translate(translationKey('Heading.Bans', TranslationNamespace.Navigation));

  return (
    <div className='width-full gap-large flex flex-col'>
      <div className='width-full [box-shadow:inset_0_calc(-1*var(--stroke-thick))_0_var(--color-stroke-muted)]'>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          size='Medium'
          variant='Inlined'
          fitBehavior='Fit'>
          <TabsList>
            <TabsTrigger value={ModerationTab.Bans} className='padding-x-medium'>
              {bansLabel}
            </TabsTrigger>
            <TabsTrigger value={ModerationTab.AntiCheat} className='padding-x-medium'>
              {antiCheatLabel}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  );
};

export default ModerationTabs;
