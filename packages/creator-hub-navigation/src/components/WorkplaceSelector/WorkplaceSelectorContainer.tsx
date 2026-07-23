import React, { useCallback } from 'react';
import Router from 'next/router';
import { CircularProgress, makeStyles } from '@rbx/ui';
import WorkplaceSelector from './components/WorkplaceSelector';
import { useWorkspaces } from '../../providers/WorkspaceProvider';
import useProductUrls from '../../utils/useProductUrls';

const useStyles = makeStyles()(() => ({
  loading: { height: '42px' },
}));

type TWorkplaceSelectorContainer = {
  collapsed: boolean;
};
const WorkplaceSelectorContainer: React.FunctionComponent<TWorkplaceSelectorContainer> = ({
  collapsed,
}) => {
  const {
    classes: { loading },
  } = useStyles();
  const {
    Dashboard: { createGroups },
  } = useProductUrls();
  const { sort, setSort, workspaces, currentWorkspace, isLoading, setCurrentWorkspace } =
    useWorkspaces();

  const onCreate = useCallback(() => {
    Router.push(createGroups);
  }, [createGroups]);

  if (workspaces === null || isLoading) {
    return (
      <div className={loading}>
        <CircularProgress color='secondary' />
      </div>
    );
  }

  return (
    <WorkplaceSelector
      collapsed={collapsed}
      currentWorkspace={currentWorkspace}
      workspaces={workspaces}
      sortBy={sort}
      onSortUpdate={setSort}
      onCreate={onCreate}
      onWorkspaceSelect={setCurrentWorkspace}
    />
  );
};

export default WorkplaceSelectorContainer;
