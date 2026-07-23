import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import type { TSorts } from '../../../providers/WorkspaceProvider/constants';
import { WorkspaceSorts } from '../../../providers/WorkspaceProvider/constants';
import WorkspaceMenuItem from './WorkplaceSortMenuItem';

type TSortMenu = {
  sortBy: TSorts;
  onSortUpdate: (sort: TSorts) => void;
};

const SortMenu: React.FunctionComponent<TSortMenu> = ({ sortBy, onSortUpdate }) => {
  const { translate } = useTranslation();

  return (
    <Grid>
      <WorkspaceMenuItem
        value={WorkspaceSorts.Priority}
        selected={sortBy === WorkspaceSorts.Priority}
        onSelect={onSortUpdate}>
        {translate('Label.Priority')}
      </WorkspaceMenuItem>
      <WorkspaceMenuItem
        value={WorkspaceSorts.Recent}
        selected={sortBy === WorkspaceSorts.Recent}
        onSelect={onSortUpdate}>
        {translate('Label.RecentlyUsed')}
      </WorkspaceMenuItem>
      <WorkspaceMenuItem
        value={WorkspaceSorts.CreatedAt}
        selected={sortBy === WorkspaceSorts.CreatedAt}
        onSelect={onSortUpdate}>
        {translate('Label.DateCreated')}
      </WorkspaceMenuItem>
      <WorkspaceMenuItem
        value={WorkspaceSorts.Alphabetically}
        selected={sortBy === WorkspaceSorts.Alphabetically}
        onSelect={onSortUpdate}>
        {translate('Label.Alphabetically')}
      </WorkspaceMenuItem>
    </Grid>
  );
};

export default SortMenu;
