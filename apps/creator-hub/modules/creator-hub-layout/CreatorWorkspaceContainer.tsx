import { useEffect } from 'react';
import { useWorkspaces } from '@rbx/creator-hub-navigation';
import useAppBreadcrumbsData from '@modules/navigation/layout/hooks/useAppBreadcrumbsData';

const CreatorWorkspaceContainer: React.FunctionComponent = () => {
  const { currentItemType, isCurrentItemLoading, currentItemGroupId } = useAppBreadcrumbsData();
  const { isLoading, setWorkspaceByGroupId } = useWorkspaces();

  useEffect(() => {
    if (currentItemType && !isCurrentItemLoading && !isLoading) {
      setWorkspaceByGroupId(currentItemGroupId ?? null);
    }
  }, [currentItemGroupId, currentItemType, isCurrentItemLoading, isLoading, setWorkspaceByGroupId]);

  return null;
};

export default CreatorWorkspaceContainer;
