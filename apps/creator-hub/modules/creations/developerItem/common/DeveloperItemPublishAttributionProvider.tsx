import React, {
  useContext,
  createContext,
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { developClient } from '@modules/clients';
import { useRouter } from 'next/router';
import Asset from '@modules/miscellaneous/common/enums/Asset';

export type DeveloperItemCreatingUniverse = {
  id: number;
  name: string;
  rootPlaceId: number;
};

export type DeveloperItemPublishAttributionContext = {
  creatingUniverse?: DeveloperItemCreatingUniverse;
};

const defaultValue: DeveloperItemPublishAttributionContext = {
  creatingUniverse: undefined,
};

export const DeveloperItemPublishAttributionContext =
  createContext<DeveloperItemPublishAttributionContext>(defaultValue);

export const publishAttribtuionEnabledAssetTypes = [Asset.Model];

export const DeveloperItemPublishAttributionProvider: FunctionComponent<
  React.PropsWithChildren<unknown>
> = ({ children }) => {
  const [creatingUniverse, setCreatingUniverse] = useState<
    DeveloperItemCreatingUniverse | undefined
  >();

  const router = useRouter();

  const fetchDetails = useCallback(async () => {
    const { isReady } = router;
    if (!isReady) {
      return;
    }

    const { id } = router.query;
    const developerItemId = parseInt(id as string, 10);
    try {
      // check creatingUniverseId of latest version for publish attribution
      const { data } = await developClient.getAssetPublishedVersions(developerItemId);
      if (data && data.length > 0) {
        const latestVersion = data[0];
        const { creatingUniverseId } = latestVersion;
        if (creatingUniverseId) {
          const universeDetail = await developClient.getUniverseDetails(creatingUniverseId);
          setCreatingUniverse({
            id: creatingUniverseId,
            name: universeDetail.name || '',
            rootPlaceId: universeDetail.rootPlaceId ?? 0,
          });
        }
      }
    } catch {
      setCreatingUniverse(undefined);
    }
  }, [router]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const value = useMemo(() => {
    return { creatingUniverse };
  }, [creatingUniverse]);

  return (
    <DeveloperItemPublishAttributionContext.Provider value={value}>
      {children}
    </DeveloperItemPublishAttributionContext.Provider>
  );
};

export function useCurrentDeveloperItemPublishAttribution() {
  return useContext(DeveloperItemPublishAttributionContext);
}
