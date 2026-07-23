import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, CloseIcon, Grid, IconButton, Tab, Tabs, Typography, useSnackbar } from '@rbx/ui';
import type { TUser } from '@modules/authentication/types';
import type { DeveloperItemDetails } from '../../types';
import PermissionDeveloperItemCollaboratorsTab from './Collaborators/PermissionDeveloperItemCollaboratorsTab';
import PermissionDeveloperItemExperiencesTab from './Experiences/PermissionDeveloperItemExperiencesTab';
import usePermissionDeveloperItemWithTabsStyles from './PermissionDeveloperItemWithTabs.styles';
import type { PermissionToastMessage } from './Shared/types';
import { PermissionTab } from './Shared/types';

export type PermissionDeveloperItemWithTabsProps = {
  developerItemDetails: DeveloperItemDetails;
  user: TUser;
};

const PermissionDeveloperItemWithTabs: FunctionComponent<
  React.PropsWithChildren<PermissionDeveloperItemWithTabsProps>
> = ({ developerItemDetails, user }) => {
  const {
    classes: { alert, container, headerContainer, iconButton, tabPanel },
  } = usePermissionDeveloperItemWithTabsStyles();
  const { translate } = useTranslation();
  const { enqueue, close } = useSnackbar();
  const [currentTab, setCurrentTab] = useState(PermissionTab.COLLABORATORS);

  const tabName = (tab: PermissionTab) => {
    switch (tab) {
      case PermissionTab.EXPERIENCES:
        return translate('Label.Experiences');
      case PermissionTab.COLLABORATORS:
      default:
        return translate('Label.Collaborators');
    }
  };

  const getTabProps = (tab: PermissionTab) => {
    const tabNameValue = tabName(tab);
    return {
      id: tabNameValue,
      label: tabNameValue,
      value: tab,
      'aria-controls': tabNameValue,
    };
  };

  const getTabPanelProps = (tab: PermissionTab) => {
    const tabNameValue = tabName(tab);
    return {
      hidden: currentTab !== tab,
      id: tabNameValue,
      role: 'tabpanel',
      'aria-labelledby': tabNameValue,
      'data-testid': `permissions-tab-panel-${tabNameValue}`,
    };
  };

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: PermissionTab) => {
    setCurrentTab(newValue);
  }, []);

  const createToastMessage = (title: string, description: string) => {
    return (
      <>
        <Grid>
          <Typography component='alert-title'>{title}</Typography>
        </Grid>
        <Grid>
          <Typography component='alert-description'>{description}</Typography>
        </Grid>
      </>
    );
  };

  const handleShowToastMessages = useCallback(
    (messages: PermissionToastMessage[]) => {
      enqueue({
        children: (
          <div>
            {messages.map((message) => {
              if (message.isSuccess) {
                return (
                  <Alert
                    key={message.title}
                    classes={{ root: alert }}
                    severity='success'
                    variant='filled'>
                    {createToastMessage(message.title, message.description)}
                  </Alert>
                );
              }
              return (
                <Alert
                  key={message.title}
                  action={
                    <IconButton
                      aria-label='Close'
                      classes={{ root: iconButton }}
                      color='inherit'
                      onClick={() => close()}
                      size='small'>
                      <CloseIcon />
                    </IconButton>
                  }
                  classes={{ root: alert }}
                  severity='error'
                  variant='filled'>
                  {createToastMessage(message.title, message.description)}
                </Alert>
              );
            })}
          </div>
        ),
        autoHide: true,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      });
    },
    [alert, close, enqueue, iconButton],
  );

  return (
    <Grid container data-testid='permissions-tab-container' classes={{ root: container }}>
      <Grid container item direction='column' gap={2} classes={{ root: headerContainer }}>
        <Grid item>
          <Typography color='secondary' variant='body1'>
            {translate('Description.Permissions')}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab {...getTabProps(PermissionTab.COLLABORATORS)} />
          <Tab {...getTabProps(PermissionTab.EXPERIENCES)} />
        </Tabs>
      </Grid>
      <Grid container item direction='column' classes={{ root: tabPanel }}>
        <Grid item {...getTabPanelProps(PermissionTab.COLLABORATORS)}>
          <PermissionDeveloperItemCollaboratorsTab
            developerItemDetails={developerItemDetails}
            user={user}
            handleShowToastMessage={handleShowToastMessages}
          />
        </Grid>
        <Grid item {...getTabPanelProps(PermissionTab.EXPERIENCES)}>
          <PermissionDeveloperItemExperiencesTab
            developerItemDetails={developerItemDetails}
            user={user}
            handleShowToastMessage={handleShowToastMessages}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PermissionDeveloperItemWithTabs;
