import type { FunctionComponent } from 'react';
import React, { useContext, createContext, useMemo } from 'react';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { OwnerType } from '@modules/clients/analytics';
import useQueryParams, {
  normalizeSingleQueryParam,
} from '@modules/miscellaneous/hooks/useQueryParams';

type OwnerBundle = {
  ownerType?: OwnerType;
  ownerId?: number;
};

const OwnerOverrideContext = createContext<OwnerBundle>({});

const isOwnerType = (value: string): value is OwnerType =>
  Object.values<string>(OwnerType).includes(value);

const ownerOverrideQueryKeys = [
  AnalyticsQueryParams.OverrideOwnerType,
  AnalyticsQueryParams.OverrideOwnerId,
] as const;

OwnerOverrideContext.displayName = 'OwnerOverrideContext';

export const useAnalyticsOwnerOverride = () => {
  return useContext(OwnerOverrideContext);
};

const AnalyticsOwnerOverrideProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const [queryParams] = useQueryParams(ownerOverrideQueryKeys);
  const ownerTypeRaw = normalizeSingleQueryParam(
    queryParams[AnalyticsQueryParams.OverrideOwnerType],
  );
  const ownerIdRaw = normalizeSingleQueryParam(queryParams[AnalyticsQueryParams.OverrideOwnerId]);

  const ownerType: OwnerType | undefined =
    ownerTypeRaw && isOwnerType(ownerTypeRaw) ? ownerTypeRaw : undefined;

  const parsedOwnerId = Number(ownerIdRaw);
  const ownerId: number | undefined =
    ownerIdRaw && !Number.isNaN(parsedOwnerId) ? parsedOwnerId : undefined;

  const context = useMemo(() => {
    return {
      ownerType,
      ownerId,
    };
  }, [ownerType, ownerId]);
  return <OwnerOverrideContext.Provider value={context}>{children}</OwnerOverrideContext.Provider>;
};

export default AnalyticsOwnerOverrideProvider;
