import type { FunctionComponent } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { GetCreatorMetadataResponse } from '@rbx/client-affiliate-links-api/v1';
import { Requirements } from '@rbx/client-affiliate-links-api/v1';
import { withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import groupsClient from '@modules/clients/groups';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import {
  getGroupCreatorMetadata,
  getGroupEligibility,
  getRequirements,
  getUserCreatorMetadata,
} from '@modules/react-query/affiliateLinks/affiliateLinksRequests';

export interface AffiliateProgramContextValue {
  isAffiliateProgramLoading: boolean;
  requiresActionToJoinProgram?: boolean;
  compliantWithAllUserRequirements?: boolean;
  creatorMetadata?: GetCreatorMetadataResponse;
  requirements?: Requirements[];
  isCurrentUserGroupOwner?: boolean;
  isGroupEligible?: boolean;
}

export const AffiliateProgramContext = createContext<AffiliateProgramContextValue>({
  isAffiliateProgramLoading: false,
  requiresActionToJoinProgram: undefined,
  compliantWithAllUserRequirements: undefined,
  creatorMetadata: undefined,
  isCurrentUserGroupOwner: undefined,
  isGroupEligible: undefined,
});
AffiliateProgramContext.displayName = 'AffiliateProgram';

export function useAffiliateProgram() {
  return useContext(AffiliateProgramContext);
}

const AffiliateProgramProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();

  // AffiliateLink Metadata for the creator
  const [creatorMetadata, setCreatorMetadata] = useState<
    GetCreatorMetadataResponse | undefined | null
  >(undefined);

  const [requirements, setRequirements] = useState<Requirements[] | null>();
  const [isGroupEligible, setisGroupEligible] = useState<boolean | null>();

  // Whether the user has fulfilled all prerequisites to join the affiliate program
  const [compliantWithAllUserRequirements, setCompliantWithAllUserRequirements] =
    useState<boolean>();
  const [requiresActionToJoinProgram, setRequiresActionToJoinProgram] = useState<boolean>();

  // Whether the user is in a group and if they are the group owner
  const isGroup = useMemo(() => (currentGroup?.id ?? 0) !== 0, [currentGroup]);
  const [isCurrentUserGroupOwner, setIsCurrentUserGroupOwner] = useState<boolean | undefined>(
    undefined,
  );

  // Loading depends on the allowlist (plus any latter prerequisites)
  const isLoading =
    creatorMetadata === undefined ||
    requirements === undefined ||
    (isGroupEligible === undefined && isGroup);

  const fetchCreatorMetadata = useCallback(async () => {
    try {
      if (isGroup && currentGroup?.id) {
        // Context is for a group and the groupId is ready, fetch for the group's creator metadata
        const metadataResponse = await getGroupCreatorMetadata(currentGroup.id);

        setCreatorMetadata(metadataResponse);
        return;
      }

      if (!isGroup && user?.id) {
        // Context is for a user and the userId is ready, fetch for the user's creator metadata
        const metadataResponse = await getUserCreatorMetadata();

        setCreatorMetadata(metadataResponse);
        return;
      }
    } catch {
      return;
    }

    setCreatorMetadata(null);
  }, [currentGroup?.id, isGroup, user?.id]);

  const fetchRequirements = useCallback(async () => {
    if ((isGroup && isCurrentUserGroupOwner) || !isGroup) {
      try {
        // Either is in a group context as group owner or the context is for a user
        const requirementsResponse = await getRequirements();
        setRequirements(requirementsResponse.requirements);
        return;
      } catch {
        return;
      }
    }

    setRequirements(null);
  }, [isCurrentUserGroupOwner, isGroup]);

  const fetchGroupEligibility = useCallback(async () => {
    if (isGroup && currentGroup?.id) {
      try {
        const eligibilityResponse = await getGroupEligibility(currentGroup.id);
        setisGroupEligible(eligibilityResponse.isEligible);
      } catch {
        setisGroupEligible(false);
      }
    }
  }, [currentGroup, isGroup]);

  useEffect(() => {
    if (isLoading) {
      setRequiresActionToJoinProgram(undefined);
      return;
    }

    if (isGroup && !isCurrentUserGroupOwner) {
      // Check if user is group owner, since only the group owner can fulfill prerequisites on behalf of the group
      setRequiresActionToJoinProgram(false);
      return;
    }

    // If the the program is enabled and the user is not compliant with all requirements, they are eligible to join the program
    setRequiresActionToJoinProgram(compliantWithAllUserRequirements === false);
  }, [isGroup, isCurrentUserGroupOwner, compliantWithAllUserRequirements, isLoading]);

  useEffect(() => {
    const fetchGroupOwner = async () => {
      if (isGroup && currentGroup?.id) {
        const groupInfo = await groupsClient.getGroupInfo(currentGroup.id);
        return groupInfo.owner?.userId;
      }

      return;
    };

    fetchGroupOwner().then((groupOwner: number | undefined) => {
      if (groupOwner && user) {
        setIsCurrentUserGroupOwner(groupOwner === user.id);
      }
    });
  }, [currentGroup?.id, isGroup, user]);

  useEffect(() => {
    if (isLoading || !requirements) {
      setCompliantWithAllUserRequirements(undefined);
      return;
    }

    if (isGroup && !isCurrentUserGroupOwner) {
      // Check if user is group owner, since only the group owner can fulfill prerequisites on behalf of the group
      setCompliantWithAllUserRequirements(undefined);
      return;
    }

    const userHasFulfilledAllRequirements =
      requirements?.length === 0 ||
      (requirements?.length === 1 && requirements[0] === Requirements.Payable);

    setCompliantWithAllUserRequirements(userHasFulfilledAllRequirements);
  }, [isCurrentUserGroupOwner, isGroup, isLoading, requirements]);

  useEffect(() => {
    fetchCreatorMetadata();
  }, [fetchCreatorMetadata]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  useEffect(() => {
    fetchGroupEligibility();
  }, [fetchGroupEligibility]);

  const memoizedValue = useMemo(() => {
    return {
      isAffiliateProgramLoading: isLoading,
      requiresActionToJoinProgram,
      compliantWithAllUserRequirements,
      creatorMetadata: creatorMetadata ?? undefined,
      requirements: requirements ?? undefined,
      isCurrentUserGroupOwner,
      isGroupEligible: isGroupEligible ?? undefined,
    };
  }, [
    isLoading,
    requiresActionToJoinProgram,
    compliantWithAllUserRequirements,
    creatorMetadata,
    requirements,
    isCurrentUserGroupOwner,
    isGroupEligible,
  ]);

  return (
    <AffiliateProgramContext.Provider value={memoizedValue}>
      {children}
    </AffiliateProgramContext.Provider>
  );
};

export default withTranslation(AffiliateProgramProvider, [TranslationNamespace.Organization]);
