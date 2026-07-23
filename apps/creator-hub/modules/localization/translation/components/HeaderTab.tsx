import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { FeedbackRoundedIcon, Tab, Tabs, Tooltip, TTabsProps } from '@rbx/ui';
import { useSettings } from '@modules/settings';
import useEntryManagement from '../../gameStringTranslation/hooks/useEntryManagement';
import getTranslation from '../../gameStringTranslation/utils/testFeedbackUtils';
import TranslationFeatureOptions from '../enums/TranslationFeatureOptions';
import useHeaderTabStyle from './HeaderTab.style';
import { translationTabMap } from '../constants';

export interface TranslationNavigationProps {
  selectedTab: string;
  onTabChange: (event: React.ChangeEvent, newValue: unknown) => void;
}

const HeaderTab: FunctionComponent<React.PropsWithChildren<TranslationNavigationProps>> = ({
  selectedTab,
  onTabChange,
}) => {
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const {
    classes: { tab, stringsTab, icon },
  } = useHeaderTabStyle();
  const { doesTranslationFeedbackExist } = useEntryManagement();

  return (
    <Tabs className={tab} value={selectedTab} onChange={onTabChange as TTabsProps['onChange']}>
      <Tab
        value={translationTabMap[TranslationFeatureOptions.GameInfo]}
        label={translate('Label.GameInfo')}
      />
      <Tab
        className={stringsTab}
        value={translationTabMap[TranslationFeatureOptions.GameStrings]}
        label={translate('Label.GameStrings')}
      />
      {settings.enableManualTranslationFeedback && doesTranslationFeedbackExist && (
        <Tooltip
          className={icon}
          // TODO: update this when strings are ready for production
          title={getTranslation(
            translate(`Message.FeedbackAvailable`),
            'Feedback is available for some of your translations.',
          )}
          arrow
          placement='bottom'
          aria-label='feedback'>
          <FeedbackRoundedIcon
            color={
              selectedTab === translationTabMap[TranslationFeatureOptions.GameStrings]
                ? 'primary'
                : 'secondary'
            }
            fontSize='small'
          />
        </Tooltip>
      )}
      <Tab
        value={translationTabMap[TranslationFeatureOptions.GameProducts]}
        label={translate('Label.GameProducts')}
      />
    </Tabs>
  );
};

export default HeaderTab;
