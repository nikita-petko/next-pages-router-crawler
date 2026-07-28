import type { FunctionComponent } from 'react';
import React, { useMemo, useEffect, useCallback } from 'react';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation } from '@rbx/intl';
import { Divider, Tab } from '@rbx/ui';
import { HorizontalTabs } from '@modules/miscellaneous/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import ServerManagementTabs from '../../enums/ServerManagementTabs';
import RestartActivityCardV2 from '../RestartActivityCard/RestartActivityCardV2';
import SelectablePlacesTableV2 from '../SelectablePlacesTable/SelectablePlacesTableV2';
import useTabbedPageManagerStyles from './TabbedPageManager.styles';

const TabbedPageManager: FunctionComponent = () => {
  const { classes } = useTabbedPageManagerStyles();
  const { translate } = useTranslation();
  const [query, setQueryParamValues] = useQueryParams(['activeTab']);

  const { divider } = classes;

  const activeServerManagementTab = useMemo(() => {
    if (!Object.values(ServerManagementTabs).includes(query.activeTab as ServerManagementTabs)) {
      return ServerManagementTabs.ServerBrowser;
    }
    return query.activeTab as ServerManagementTabs;
  }, [query.activeTab]);

  // Set the activeTab query param if it's not present or invalid
  useEffect(() => {
    if (!Object.values(ServerManagementTabs).includes(query.activeTab as ServerManagementTabs)) {
      setQueryParamValues({ activeTab: ServerManagementTabs.ServerBrowser });
    }
  }, [query.activeTab, setQueryParamValues]);

  const handleTabChange = useCallback(
    async (_event: React.ChangeEvent<unknown>, value: ServerManagementTabs | string) => {
      setQueryParamValues({ activeTab: value.toString() });
    },
    [setQueryParamValues],
  );

  return (
    <div>
      <HorizontalTabs
        value={activeServerManagementTab}
        onChange={(_event, value) => handleTabChange(_event, value as string)}>
        {Object.values(ServerManagementTabs).map((type) => (
          <Tab label={translate(`Label.${type}`)} value={type} key={type} />
        ))}
      </HorizontalTabs>
      <Divider className={divider} />
      {activeServerManagementTab === ServerManagementTabs.ServerBrowser && (
        <SelectablePlacesTableV2 />
      )}
      {activeServerManagementTab === ServerManagementTabs.RestartMonitor && (
        <RestartActivityCardV2 />
      )}
      <HubMeta hubOnly title={buildTitle(translate(`Label.${activeServerManagementTab}`))} />
    </div>
  );
};

export default TabbedPageManager;
