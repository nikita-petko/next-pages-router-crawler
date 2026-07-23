import type { ChangeEvent, FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import type { TTabsProps } from '@rbx/ui';
import { Tab, Tabs, Divider, Grid } from '@rbx/ui';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useLocalizationLayoutStyles from '../../common/components/LocalizationLayout.styles';
import LocalizationFeatureOptions from '../enums/LocalizationFeatureOptions';

export interface LocalizationNavigationProps {
  onSelectTab: (value: LocalizationFeatureOptions) => void;
  currentTab: LocalizationFeatureOptions;
}

const LocalizationNavigation: FunctionComponent<
  React.PropsWithChildren<LocalizationNavigationProps>
> = ({ onSelectTab, currentTab }) => {
  const { translate } = useTranslation();
  const {
    classes: { divider },
  } = useLocalizationLayoutStyles();
  const { settings } = useSettings();
  const handleChange = (event: ChangeEvent<HTMLElement>, value: unknown) => {
    onSelectTab(value as LocalizationFeatureOptions);
  };

  return (
    <Grid>
      <Tabs
        value={currentTab}
        orientation='horizontal'
        onChange={handleChange as TTabsProps['onChange']}>
        <Tab value={LocalizationFeatureOptions.LanguageTab} label={translate('Label.Languages')} />
        <Tab
          value={LocalizationFeatureOptions.TranslatorTab}
          label={translate('Label.Translators')}
        />
        <Tab value={LocalizationFeatureOptions.ReportTab} label={translate('Label.Reports')} />
        <Tab value={LocalizationFeatureOptions.SettingTab} label={translate('Label.Settings')} />
        {settings.enableLocalizationCsvManagement && (
          <Tab
            value={LocalizationFeatureOptions.TableManagementTab}
            label={translate('Label.TableManagement')}
          />
        )}
      </Tabs>
      <Divider className={divider} />
    </Grid>
  );
};

export default LocalizationNavigation;
