import { useMemo } from 'react';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { CreatorType } from '@modules/miscellaneous/common';
import {
  AssetPrivacyLevel,
  useGetGroupAssetPrivacyDefault,
  useGetUserAssetPrivacyDefault,
} from '@modules/react-query/assetPermissions';

export interface AssetPrivacyEnrollmentInformation {
  enrollUrl: string;
  creatorAlreadyEnrolled: boolean;
  eligibleForEnrollLink: boolean;
  isPending: boolean;
}

export interface UseAssetPrivacyEnrollmentInformationParams {
  creator: { id: number; type: CreatorType };
  enabled?: boolean;
}

/**
 * Hook that provides asset privacy enrollment information for creators (users or groups).
 *
 * This hook determines:
 * - Appropriate enrollment URLs based on creator type
 * - Current enrollment status for users and groups
 * - Whether to show enrollment links based on permissions
 * - Loading states for async data
 *
 * @param creator - Creator object with id and type
 * @param enabled - Whether to fetch privacy enrollment information
 * @returns Object containing enrollment information and computed states
 */
const useAssetPrivacyEnrollmentInformation = ({
  creator,
  enabled = true,
}: UseAssetPrivacyEnrollmentInformationParams): AssetPrivacyEnrollmentInformation => {
  const { permissions } = useCurrentOrganization();

  const creatorId = creator.id ?? -1;
  const isCreatorGroup = creator.type === CreatorType.Group;
  const isCreatorGroupOwner = (isCreatorGroup && permissions?.isOwner) ?? false;

  // Only users and group owners can enroll groups
  const shouldFetchPrivacyEnrollmentInformation =
    enabled && (!isCreatorGroup || isCreatorGroupOwner);

  // Generate appropriate enrollment URL based on creator type
  const enrollUrl = useMemo(() => {
    if (isCreatorGroup) {
      return `${process.env.baseUrl}/dashboard/group/profile?groupId=${creatorId}&activeTab=GroupProfileTab`;
    }
    return `${process.env.baseUrl}/settings/advanced`;
  }, [creatorId, isCreatorGroup]);

  // User enrollment information
  const { data: userAssetPrivacyDefault, isPending: isUserAssetPrivacyDefaultPending } =
    useGetUserAssetPrivacyDefault(
      creatorId,
      true, // Refetch on window focus
      shouldFetchPrivacyEnrollmentInformation && !isCreatorGroup,
    );

  // Group enrollment information
  const { data: groupAssetPrivacyDefault, isPending: isGroupAssetPrivacyDefaultPending } =
    useGetGroupAssetPrivacyDefault(
      creatorId,
      true, // Refetch on window focus
      shouldFetchPrivacyEnrollmentInformation && isCreatorGroup,
    );

  // Determine if creator is already enrolled
  const creatorAlreadyEnrolled = useMemo(() => {
    if (isCreatorGroup) {
      return groupAssetPrivacyDefault === AssetPrivacyLevel.Restricted;
    }
    return userAssetPrivacyDefault === AssetPrivacyLevel.Restricted;
  }, [isCreatorGroup, userAssetPrivacyDefault, groupAssetPrivacyDefault]);

  // Determine if creator is eligible for enrollment link
  const eligibleForEnrollLink = shouldFetchPrivacyEnrollmentInformation && !creatorAlreadyEnrolled;

  const isPending =
    shouldFetchPrivacyEnrollmentInformation &&
    ((isCreatorGroup && isGroupAssetPrivacyDefaultPending) ||
      (!isCreatorGroup && isUserAssetPrivacyDefaultPending));

  return {
    enrollUrl,
    creatorAlreadyEnrolled,
    eligibleForEnrollLink,
    isPending,
  };
};

export default useAssetPrivacyEnrollmentInformation;
