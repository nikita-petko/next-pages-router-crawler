import Router from 'next/router';
import React, { useCallback } from 'react';
import { CircularProgress, makeStyles } from '@rbx/ui';
import { useWorkspaces } from '../../providers/WorkspaceProvider';
import useProductUrls from '../../utils/useProductUrls';
import WorkplaceSelector from './components/WorkplaceSelector';

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
    // The group-create page lives under the dashboard deployment. When the
    // navigation is rendered from another deployment (e.g. /store, /talent)
    // `createGroups` is an absolute URL pointing back at the dashboard. Using
    // `Router.push` in that case causes Next.js to strip the host and prepend
    // the current deployment's `basePath`, producing a broken URL like
    // `/store/dashboard/group/create`. Use a hard navigation for cross-app
    // links to bypass `basePath` rewriting.
    if (/^https?:\/\//.test(createGroups)) {
      window.location.assign(createGroups);
      return;
    }
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
