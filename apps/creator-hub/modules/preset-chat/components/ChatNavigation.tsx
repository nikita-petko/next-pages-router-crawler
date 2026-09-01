import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { Divider, Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ChatTabOptions from '../enums/ChatTabOptions';

const isChatTabOption = (value: unknown): value is ChatTabOptions =>
  Object.values<unknown>(ChatTabOptions).includes(value);

export interface ChatNavigationProps {
  onSelectTab: (value: ChatTabOptions) => void;
  currentTab: ChatTabOptions;
}

const ChatNavigation: FunctionComponent<ChatNavigationProps> = ({ onSelectTab, currentTab }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const handleValueChange = useCallback(
    (value: string) => {
      if (isChatTabOption(value)) {
        onSelectTab(value);
      }
    },
    [onSelectTab],
  );

  return (
    <div>
      <Tabs
        value={currentTab}
        onValueChange={handleValueChange}
        size='Medium'
        variant='Inlined'
        fitBehavior='Fit'>
        <TabsList>
          <TabsTrigger value={ChatTabOptions.QuickWords} className='text-body-medium'>
            {tPendingTranslation(
              'Quick Words',
              'The current working title for Preset Chat.',
              translationKey('Label.QuickWords', TranslationNamespace.PresetChat),
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Divider />
    </div>
  );
};

export default ChatNavigation;
