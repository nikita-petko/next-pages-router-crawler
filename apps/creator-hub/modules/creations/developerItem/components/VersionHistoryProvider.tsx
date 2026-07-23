import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import type {
  RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion,
  V1AssetsAssetIdPublishedVersionsGetLimitEnum,
} from '@rbx/client-develop/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import developClient from '@modules/clients/develop';
import packagesClient from '@modules/clients/packagesApi';
import { Asset } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import VersionHistoryContext from '../hooks/VersionHistoryContext';

type VersionHistoryResponse = RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion;
type PagingParameters = {
  currentLimit: number;
  currentCursor?: string;
};
const VersionHistoryProviderComponent = ({ children }: React.PropsWithChildren) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [versionHistoryResponse, setVersionHistoryResponse] =
    useState<VersionHistoryResponse | null>(null);
  const [versionDescriptions, setVersionDescriptions] = useState<{
    [key: number]: string | null;
  }>([]);
  const [isLoadingCurrentVersionHistory, setIsLoadingCurrentVersionHistory] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [versionHistoryCount, setVersionHistoryCount] = useState(0);
  // The /publish-versions endpoint always has previousPageCursors set to undefined.
  // Have to track the cursors ourselves in order for pagination to work.
  const [previousPageCursors, setPreviousPageCursors] = useState<string[]>([]);
  const [pagingParameters, setPagingParameters] = useState<PagingParameters>({
    currentLimit: 10,
    currentCursor: undefined,
  });

  const { currentLimit } = pagingParameters;

  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const currentAssetId = useMemo(() => {
    if (isRouterReady) {
      const { id } = routerQuery;
      if (id) {
        const parsedId = parseInt(id as string, 10);
        return parsedId > 0 ? parsedId : null;
      }
    }
    return null;
  }, [isRouterReady, routerQuery]);

  const { data: currentVersionHistory, nextPageCursor } = versionHistoryResponse || {};
  const previousPageCursor: string | undefined =
    previousPageCursors[previousPageCursors.length - 1];
  const pageCount = versionHistoryCount === 0 ? 0 : Math.floor(currentLimit / versionHistoryCount);
  const { translate } = useTranslation();

  const fetchVersionHistory = useCallback(
    async (limit?: number, cursor?: string) => {
      if (currentAssetId) {
        setIsLoadingCurrentVersionHistory(true);
        try {
          const response = await developClient.getAssetPublishedVersions(
            currentAssetId,
            undefined,
            limit as V1AssetsAssetIdPublishedVersionsGetLimitEnum,
            cursor,
          );

          try {
            const descriptions: { [key: number]: string | null } = {};
            if (response.data) {
              const idsAndVersionsArr = [];
              for (let i = 0; i < response.data.length; i += 1) {
                idsAndVersionsArr.push({
                  assetId: currentAssetId,
                  assetVersionNumber: response.data[i].assetVersionNumber,
                });
              }
              const descriptionsResponse = await packagesClient.getPackageVersionNote({
                getPackageVersionNoteRequest: idsAndVersionsArr,
              });
              if (!descriptionsResponse || !descriptionsResponse.data) {
                setVersionDescriptions({});
                return;
              }
              for (let i = 0; i < descriptionsResponse.data.length; i += 1) {
                const item = descriptionsResponse.data[i];
                if (
                  item?.assetVersionNumber &&
                  item?.versionDescription?.trim() !== '' &&
                  item.versionDescription
                ) {
                  descriptions[item.assetVersionNumber] = item.versionDescription;
                }
              }
              setVersionDescriptions(descriptions);
            }
          } catch {
            setVersionDescriptions({});
          }
          setVersionHistoryResponse(response);
          if (cursor === undefined && response.data) {
            setVersionHistoryCount(
              Math.max(...response.data.map((version) => version.assetVersionNumber || 0)),
            );
          }
        } catch {
          setVersionHistoryResponse(null);
          setVersionHistoryCount(0);
        } finally {
          setIsLoadingCurrentVersionHistory(false);
        }
      }
    },
    [currentAssetId],
  );

  // NOTE (jcountryman, 04/17/24): Disabled to check in settings deletion
  // Codeowner is responsible for fixing errors.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- codeowner is responsible for fix
  const restoreCurrentVersionHistory = useCallback(async (assetVersionNumber: number) => {}, []);

  const restoreCurrentVersionHistoryAndSetNote = useCallback(
    // TODO(@nicholasng, COLLAB-4720) remove ? for currentVersion when removing enablePackageVersionDescriptions
    async (assetVersionNumber: number, assetType?: Asset | null, currentVersion?: number) => {
      if (currentAssetId) {
        setIsRestoring(true);
        await developClient.postAssetPublishedVersions(currentAssetId, assetVersionNumber);
        // TODO(@nicholasng, COLLAB-4720) remove if statement when removing enablePackageVersionDescriptions
        if (currentVersion && assetType === Asset.Model) {
          await packagesClient.setPackageVersionNote({
            assetId: currentAssetId,
            assetVersionNumber: currentVersion + 1,
            packageVersionNoteSetPackageVersionNoteRequest: {
              message: translate('Description.RestoredFromVersion', {
                versionNumber: assetVersionNumber.toString(),
              }),
            },
          });
        }
        setIsRestoring(false);
        setCurrentPage(0);
        setPreviousPageCursors([]);
        setPagingParameters((previousPageParameters) => {
          return { ...previousPageParameters, currentCursor: undefined };
        });
      }
    },
    [currentAssetId, translate],
  );

  const nextPage = useCallback(() => {
    setPreviousPageCursors((prev) => {
      if (pagingParameters.currentCursor) {
        return [...prev, pagingParameters.currentCursor];
      }

      return prev;
    });
    setPagingParameters((previousPageParameters) => {
      return { ...previousPageParameters, currentCursor: nextPageCursor };
    });
    setCurrentPage((prevCurrentPage) => {
      return Math.max(prevCurrentPage + 1, pageCount);
    });
  }, [nextPageCursor, pageCount, pagingParameters.currentCursor]);

  const previousPage = useCallback(() => {
    setPagingParameters((previousPageParameters) => {
      return { ...previousPageParameters, currentCursor: previousPageCursor };
    });
    setCurrentPage((prevCurrentPage) => {
      return Math.max(prevCurrentPage - 1, 0);
    });
    setPreviousPageCursors((prev) => {
      return prev.slice(0, prev.length - 1);
    });
  }, [previousPageCursor]);

  const setCurrentLimit = useCallback((newLimit: number) => {
    setPagingParameters({ currentCursor: undefined, currentLimit: newLimit });
    setCurrentPage(0);
  }, []);

  const refreshCurrentVersionHistory = useCallback(() => {
    return fetchVersionHistory(pagingParameters.currentLimit, pagingParameters.currentCursor);
  }, [fetchVersionHistory, pagingParameters]);

  useEffect(() => {
    refreshCurrentVersionHistory();
  }, [refreshCurrentVersionHistory]);
  const VersionHistoryValue = useMemo(() => {
    return {
      isLoadingCurrentVersionHistory,
      isRestoring,
      currentVersionHistory,
      page: currentPage,
      pageCount,
      pageSize: currentLimit,
      count: versionHistoryCount,
      versionDescriptions,
      setPageSize: setCurrentLimit,
      nextPage,
      previousPage,
      refreshCurrentVersionHistory,
      restoreCurrentVersionHistory,
      restoreCurrentVersionHistoryAndSetNote,
    };
  }, [
    isLoadingCurrentVersionHistory,
    isRestoring,
    currentVersionHistory,
    currentPage,
    pageCount,
    currentLimit,
    versionHistoryCount,
    versionDescriptions,
    setCurrentLimit,
    nextPage,
    previousPage,
    refreshCurrentVersionHistory,
    restoreCurrentVersionHistory,
    restoreCurrentVersionHistoryAndSetNote,
  ]);

  return (
    <VersionHistoryContext.Provider value={VersionHistoryValue}>
      {children}
    </VersionHistoryContext.Provider>
  );
};

export function useVersionHistory() {
  return useContext(VersionHistoryContext);
}

export const VersionHistoryProvider = withTranslation(VersionHistoryProviderComponent, [
  TranslationNamespace.VersionHistory,
  TranslationNamespace.Table,
]);
