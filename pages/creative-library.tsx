import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { ReactNode, useEffect, useState } from 'react';

import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import CreativeLibrary from '@components/creativeLibrary/CreativeLibrary';
import { TranslationNamespace } from '@constants/localization';
import PageNotFound from '@pages/404';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { getSelectedGroupId } from '@utils/groupScopedAccount';

const CreativeLibraryPage = () => {
  const fetchEssentialAppInfo = useAppStore((state: AppStoreType) => state.fetchEssentialAppInfo);
  const isCreativeLibraryEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isCreativeLibraryEnabled,
  );
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const isWorkspaceGateLoading = isAdAccountAutoCreateEnabled && isWorkspaceLoading;
  const groupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isWorkspaceGateLoading) {
      return;
    }

    setIsLoading(true);
    fetchEssentialAppInfo({ groupId }).finally(() => setIsLoading(false));
  }, [fetchEssentialAppInfo, groupId, isWorkspaceGateLoading]);

  if (!isLoading && !isCreativeLibraryEnabled) {
    return <PageNotFound />;
  }

  return (
    <AdsManagerPageBaseLayout groupId={groupId} isLoading={isLoading || isWorkspaceGateLoading}>
      <CreativeLibrary />
    </AdsManagerPageBaseLayout>
  );
};

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerClassName: 'text-body-medium',
    headerKey: 'Heading.CreativeLibrary',
    headerNamespace: TranslationNamespace.CreativeLibrary,
  });

CreativeLibraryPage.getPageLayout = getPageLayout;

export default CreativeLibraryPage;
