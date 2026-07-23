import React, { ChangeEvent, FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Tab, Tabs, Divider, TTabsProps, Grid } from '@rbx/ui';
import MatchmakingFeatureOptions from '../enums/MatchmakingFeatureOptions';
import useMatchmakingLayoutStyles from '../MatchmakingLayout.styles';

export interface MatchmakingNavigationProps {
  onSelectTab: (value: MatchmakingFeatureOptions) => void;
  currentTab: MatchmakingFeatureOptions;
}

const MatchmakingNavigation: FunctionComponent<
  React.PropsWithChildren<MatchmakingNavigationProps>
> = ({ onSelectTab, currentTab }) => {
  const { translate } = useTranslation();
  const {
    classes: { divider, navigation },
  } = useMatchmakingLayoutStyles();
  const handleChange = (event: ChangeEvent<{}>, value: unknown) => {
    onSelectTab(value as MatchmakingFeatureOptions);
  };

  return (
    <Grid className={navigation}>
      <Tabs
        value={currentTab}
        orientation='horizontal'
        onChange={handleChange as TTabsProps['onChange']}>
        <Tab
          value={MatchmakingFeatureOptions.Configuration}
          label={translate('Label.Configuration')}
        />
        <Tab value={MatchmakingFeatureOptions.Attributes} label={translate('Label.Attributes')} />
        <Tab value={MatchmakingFeatureOptions.Analytics} label={translate('Label.Analytics')} />
      </Tabs>
      <Divider className={divider} />
    </Grid>
  );
};

export default MatchmakingNavigation;
