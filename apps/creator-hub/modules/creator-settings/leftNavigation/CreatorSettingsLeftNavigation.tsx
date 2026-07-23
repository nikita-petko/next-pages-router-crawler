import React from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import CreatorSettingsLeftNavigationMenu from './CreatorSettingsLeftNavigationMenu';

const CreatorSettingsLeftNavigation = () => {
  return (
    <Grid item container direction='column'>
      <ToolboxServiceApiProvider>
        <CreatorSettingsLeftNavigationMenu />
      </ToolboxServiceApiProvider>
    </Grid>
  );
};

export default withTranslation(CreatorSettingsLeftNavigation, [TranslationNamespace.Navigation]);
