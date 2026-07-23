import React, { useMemo, FunctionComponent, useCallback, Fragment, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { RobloxIcon, StudioIcon } from '@rbx/ui';
import useLeftNavigationState from '@modules/navigation/layout/hooks/useLeftNavigationState';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getHomeUrl } from '@modules/miscellaneous/common/urls/www';
import { MenuItem } from '../interface/menuItem';
import LeftNavigationList from '../componentsV2/LeftNavigationList';

type TResourceItem = {
  icon: ReactNode;
  key: string;
  nameKey: string;
  title?: string;
  getExternalPath?: () => string;
};

const Resources: FunctionComponent = () => {
  const { open, dialog, isCompatible } = useStudio();
  const { translate } = useTranslation();

  const resourceItems = useMemo(() => {
    const resources: TResourceItem[] = [];

    if (isCompatible === true) {
      resources.unshift({
        icon: <StudioIcon />,
        key: 'openStudio',
        nameKey: 'Heading.Studio',
      });
    }

    if (process.env.buildTarget === 'global') {
      resources.unshift({
        icon: <RobloxIcon />,
        key: 'robloxHome',
        nameKey: 'Heading.Roblox',
        title: 'Roblox.com',
        getExternalPath: () => getHomeUrl(),
      });
    }

    return resources;
  }, [isCompatible]);

  const handleSelectFeature = useCallback(
    async (item: MenuItem) => {
      const content = item.content as TResourceItem;
      if (content.getExternalPath) {
        window.open(content.getExternalPath(), '_blank');
      }
      if (item?.key === 'openStudio') {
        open({ task: EStudioTaskType.Default });
      }
      unifiedLoggerClient.logClickEvent({
        eventName: `clickLeftNav.creations.${item.key}`,
      });
    },
    [open],
  );
  const { primarySidebarExpanded } = useLeftNavigationState();

  return (
    <Fragment>
      <LeftNavigationList
        header={primarySidebarExpanded ? translate('Heading.QuickLinks') : undefined}
        items={resourceItems.map((resource) => ({
          icon: resource.icon,
          key: resource.key,
          title: resource.title || translate(resource.nameKey),
          content: resource,
        }))}
        onSelectItem={handleSelectFeature}
        iconOnly={!primarySidebarExpanded}
      />
      {dialog}
    </Fragment>
  );
};

export default Resources;
