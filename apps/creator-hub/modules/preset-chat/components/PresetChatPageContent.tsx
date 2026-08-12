import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { Divider, Link, StatusBadge } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { EmptyGrid } from '@modules/miscellaneous/components/EmptyGrid';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ChatTabOptions from '../enums/ChatTabOptions';
import ChatNavigation from './ChatNavigation';
import QuickWordsContent from './QuickWordsContent';

const PresetChatPageContent: FunctionComponent = () => {
  const { gameDetails } = useCurrentGame();
  const { settings } = useSettings();
  const { ready, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [currentTab, setCurrentTab] = useState<ChatTabOptions>(ChatTabOptions.QuickWords);

  const handleSelectTab = useCallback((value: ChatTabOptions) => {
    setCurrentTab(value);
  }, []);

  if (!settings.enableCustomPresetChat) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (!ready || !gameDetails?.id) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='preset-chat-loading' />
      </EmptyGrid>
    );
  }

  return (
    <section className='flex flex-col gap-xlarge'>
      <div className='flex flex-col gap-medium'>
        <h1 className='text-heading-large margin-none'>
          {tPendingTranslation(
            'Chat',
            'The label for the new Chat page under Creations > Configure.',
            translationKey('Heading.Chat', TranslationNamespace.Navigation),
          )}
        </h1>
        <ChatNavigation onSelectTab={handleSelectTab} currentTab={currentTab} />
      </div>
      {currentTab === ChatTabOptions.QuickWords && (
        <div className='flex flex-col'>
          <div className='flex items-center gap-xlarge width-full justify-between'>
            <div className='flex flex-col gap-xsmall'>
              <h2 className='text-heading-medium margin-none'>
                {tPendingTranslation(
                  'Quick Words',
                  'The current working title for Preset Chat.',
                  translationKey('Label.QuickWords', TranslationNamespace.PresetChat),
                )}
              </h2>
              <span className='text-body-large content-default'>
                {tPendingTranslation(
                  'Quick Words lets players of all ages coordinate gameplay with pre-written phrases.',
                  'The sub-heading for the Quick Words page.',
                  translationKey('Description.QuickWords', TranslationNamespace.PresetChat),
                )}{' '}
                <Link
                  className='content-link'
                  variant='Inline'
                  href='https://create.roblox.com/docs/chat/preset-system-guidelines'
                  target='_blank'
                  isExternal={false}>
                  {tPendingTranslation(
                    'Learn more',
                    'A link to the Preset system guidelines.',
                    translationKey('Action.LearnMore', TranslationNamespace.PresetChat),
                  )}
                </Link>
              </span>
              <div className='flex items-center gap-small padding-y-small'>
                <span className='text-caption-large content-emphasis'>
                  {tPendingTranslation(
                    'System status:',
                    'Label for the system-wide status of Quick Words',
                    translationKey('Label.SystemStatus', TranslationNamespace.PresetChat),
                  )}
                </span>
                <StatusBadge
                  size='Small'
                  variant='Standard'
                  label={tPendingTranslation(
                    'Draft',
                    'Badge label for draft status',
                    translationKey('Status.Draft', TranslationNamespace.PresetChat),
                  )}
                />
              </div>
            </div>
            {/* TODO (EXPR-4049): Publish/Save action buttons */}
          </div>
          <Divider className='margin-top-medium margin-bottom-small' />
          {/* TODO (EXPR-4047): Wire up API integration and render categories */}
          <QuickWordsContent />
        </div>
      )}
    </section>
  );
};

export default withTranslation(PresetChatPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.PresetChat,
]);
