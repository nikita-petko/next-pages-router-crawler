import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import type { TTabsProps } from '@rbx/ui';
import { Tab, Tabs } from '@rbx/ui';
import { translationTabMap } from '../constants';
import TranslationFeatureOptions from '../enums/TranslationFeatureOptions';
import useHeaderTabStyle from './HeaderTab.style';

export interface TranslationNavigationProps {
  selectedTab: string;
  onTabChange: TTabsProps['onChange'];
}

const HeaderTab: FunctionComponent<React.PropsWithChildren<TranslationNavigationProps>> = ({
  selectedTab,
  onTabChange,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { tab, stringsTab },
  } = useHeaderTabStyle();

  return (
    <Tabs className={tab} value={selectedTab} onChange={onTabChange}>
      <Tab
        value={translationTabMap[TranslationFeatureOptions.GameInfo]}
        label={translate('Label.GameInfo')}
      />
      <Tab
        className={stringsTab}
        value={translationTabMap[TranslationFeatureOptions.GameStrings]}
        label={translate('Label.GameStrings')}
      />
      <Tab
        value={translationTabMap[TranslationFeatureOptions.GameProducts]}
        label={translate('Label.GameProducts')}
      />
    </Tabs>
  );
};

export default HeaderTab;
