import React, { createContext, FunctionComponent, useCallback, useMemo } from 'react';
import { ChartResourceType } from '@modules/charts-generic';
import { useAuthentication } from '@modules/authentication/providers';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { OwnerType } from '@modules/clients/analytics';
import { ChartResourceContextType } from '../../types/ChartResourceContextType';
import { useAnalyticsOwnerOverride } from '../AnalyticsOwnerOverrideProvider';

const uninitializedCreatorId = -1;

export const CreatorResourceContext = createContext<ChartResourceContextType | null>(null);
CreatorResourceContext.displayName = 'UserResourceContext';

export const CreatorResourceProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const override = useAnalyticsOwnerOverride();
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();

  const getChartResource = useCallback(() => {
    const creatorId = override.ownerId || currentGroup?.id || user?.id || uninitializedCreatorId;

    let type = null;
    if (override.ownerType) {
      type =
        override.ownerType === OwnerType.Group ? ChartResourceType.Group : ChartResourceType.User;
    } else {
      type = currentGroup ? ChartResourceType.Group : ChartResourceType.User;
    }

    return { id: creatorId, type, isLoading: creatorId === uninitializedCreatorId };
  }, [currentGroup, override.ownerId, override.ownerType, user?.id]);

  const value = useMemo(() => {
    return { getChartResource };
  }, [getChartResource]);

  return (
    <CreatorResourceContext.Provider value={value}>{children}</CreatorResourceContext.Provider>
  );
};
