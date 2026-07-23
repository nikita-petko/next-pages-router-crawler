import type { FC } from 'react';
import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Tabs, Tab, Typography } from '@rbx/ui';
import AssetPermissionsContainer from '../../asset/components/asset-permissions/AssetPermissionsContainer';
import CollaboratorPermissionsContainer from './CollaboratorPermissionsContainer';
import usePermissionsTabbedContainerStyles from './PermissionsTabbedContainer.style';

const PermissionsTabbedContainer: FC = () => {
  const { translate } = useTranslation();

  const {
    classes: { sectionHeader, permissionTabs },
  } = usePermissionsTabbedContainerStyles();
  const tabsList = [
    { label: translate('Tab.Collaborators'), key: 'collaborators' },
    { label: translate('Tab.Assets'), key: 'assets' },
  ];
  const [selectedTab, setSelectedTab] = useState('collaborators');
  const changeTab = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  return (
    <div>
      <Typography classes={{ root: sectionHeader }} component='h1' variant='h1'>
        {translate('Title.Permissions')}
      </Typography>
      <Tabs value={selectedTab} onChange={changeTab} className={permissionTabs}>
        {tabsList.map((tab) => (
          <Tab key={tab.key} value={tab.key} label={tab.label} />
        ))}
      </Tabs>
      {selectedTab === 'assets' && <AssetPermissionsContainer asSubtab />}
      {selectedTab === 'collaborators' && <CollaboratorPermissionsContainer />}
    </div>
  );
};

export default PermissionsTabbedContainer;
