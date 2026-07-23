import React, { FunctionComponent, useContext, createContext, useMemo } from 'react';
import { OwnerType } from '@modules/clients/analytics';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { AnalyticsQueryParams } from '@modules/charts-generic';

type OwnerBundle = {
  ownerType?: OwnerType;
  ownerId?: number;
};

const OwnerOverrideContext = createContext<OwnerBundle>({});

OwnerOverrideContext.displayName = 'OwnerOverrideContext';

export const useAnalyticsOwnerOverride = () => {
  return useContext(OwnerOverrideContext);
};

const AnalyticsOwnerOverrideProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const [
    {
      [AnalyticsQueryParams.OverrideOwnerType]: ownerTypeRaw,
      [AnalyticsQueryParams.OverrideOwnerId]: ownerIdRaw,
    },
  ] = useQueryParams([
    AnalyticsQueryParams.OverrideOwnerType,
    AnalyticsQueryParams.OverrideOwnerId,
  ]);
  const ownerType = useMemo(() => {
    if (!ownerTypeRaw) {
      return undefined;
    }
    const ownerTypeKey = Array.isArray(ownerTypeRaw) ? ownerTypeRaw[0] : ownerTypeRaw;
    return OwnerType[ownerTypeKey as OwnerType];
  }, [ownerTypeRaw]);

  const ownerId = useMemo(() => {
    if (!ownerIdRaw) {
      return undefined;
    }
    const ownerIdKey = Array.isArray(ownerIdRaw) ? ownerIdRaw[0] : ownerIdRaw;
    const parsedNumber = Number(ownerIdKey);
    if (Number.isNaN(parsedNumber)) {
      return undefined;
    }
    return parsedNumber;
  }, [ownerIdRaw]);

  const context = useMemo(() => {
    return {
      ownerType,
      ownerId,
    };
  }, [ownerType, ownerId]);
  return <OwnerOverrideContext.Provider value={context}>{children}</OwnerOverrideContext.Provider>;
};

export default AnalyticsOwnerOverrideProvider;
