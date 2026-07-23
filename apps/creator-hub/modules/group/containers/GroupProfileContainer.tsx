import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { withTranslation, useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import {
  AssetPrivacyLevel,
  useGetGroupAssetPrivacyDefault,
  useGetIsGroupEligibleForBeta,
} from '@modules/react-query/assetPermissions';
import { useGetGroupDetails, useGetGroupSocialLinks } from '@modules/react-query/groups';
import useSocialLinksBehavior from '@modules/social-links/hooks/useSocialLinksBehavior';
import PermissionDeniedPage from '../components/PermissionDeniedPage';
import ConfigureGroupForm from '../components/profile/ConfigureGroupForm';
import GroupOwnershipTransferAlert from '../components/profile/GroupOwnershipTransferAlert';
import type { GroupConfiguration } from '../ConfigureGroupTypes';
import useCanAccessGroupProfile from '../hooks/useCanAccessGroupProfile';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const GroupProfileContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const currentGroup = useCurrentGroup();
  const { canAccess, isLoading: isLoadingAccess } = useCanAccessGroupProfile(currentGroup?.id);
  const { permissions } = useCurrentOrganization();
  const { data: assetPrivacyDefault, isFetching: assetPrivacyDefaultFetching } =
    useGetGroupAssetPrivacyDefault(currentGroup?.id ?? -1, !!currentGroup?.id);

  const { data: isGroupEligibleForBeta, isFetching: isGroupEligibleForBetaFetching } =
    useGetIsGroupEligibleForBeta(currentGroup?.id ?? -1, !!currentGroup?.id);

  const {
    data: groupDetails,
    isFetching: isGroupDetailsFetching,
    isError: isGroupDetailsError,
    refetch: refetchGroupDetails,
  } = useGetGroupDetails(currentGroup?.id, !!currentGroup?.id && !!currentGroup?.name);

  const {
    data: socialLinksResult,
    isFetching: isSocialLinksFetching,
    isError: isSocialLinksError,
    refetch: refetchSocialLinks,
  } = useGetGroupSocialLinks(currentGroup?.id, !!currentGroup?.id && !!currentGroup?.name);

  const { isLoading: isSocialLinksBehaviorLoading } = useSocialLinksBehavior();

  // oxlint-disable-next-line react/react-compiler
  const groupConfiguration: GroupConfiguration | null = useMemo(() => {
    if (!currentGroup?.id || !currentGroup?.name || !groupDetails || !socialLinksResult) {
      return null;
    }

    return {
      id: currentGroup.id,
      icon: {
        src: '',
      },
      name: currentGroup.name,
      description: groupDetails.description,
      socialLinks: socialLinksResult.data,
      groupSocialLinksAgeVerificationStatus:
        socialLinksResult.groupSocialLinksAgeVerificationStatus,
      owner: {
        id: groupDetails.owner?.userId,
        name: groupDetails.owner?.username,
        displayName: groupDetails.owner?.displayName,
      },
      assetPrivacyDefaultRestricted: assetPrivacyDefault === AssetPrivacyLevel.Restricted,
    };
  }, [currentGroup?.id, currentGroup?.name, groupDetails, socialLinksResult, assetPrivacyDefault]);

  const refreshGroupConfiguration = useCallback(async () => {
    await Promise.all([refetchGroupDetails(), refetchSocialLinks()]);
  }, [refetchGroupDetails, refetchSocialLinks]);

  const isLoading =
    isLoadingAccess ||
    isGroupDetailsFetching ||
    isSocialLinksFetching ||
    assetPrivacyDefaultFetching ||
    isGroupEligibleForBetaFetching;

  if (isGroupDetailsError || isSocialLinksError) {
    return <ErrorPage errorCode={StatusCodes.BAD_REQUEST} />;
  }

  if (!groupConfiguration || isLoading || isSocialLinksBehaviorLoading) {
    return (
      <Grid container justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <>
      <HubMeta
        title={buildTitle(translate('Label.GroupProfile'))}
        breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Label.GroupProfile'))}
      />
      <GroupOwnershipTransferAlert groupConfiguration={groupConfiguration} />
      {canAccess ? (
        <ConfigureGroupForm
          groupConfiguration={groupConfiguration}
          refreshGroupConfiguration={refreshGroupConfiguration}
          isGroupConfigurationReady
          enableCreatorPrivacySettings={
            isGroupEligibleForBeta === true && permissions?.isOwner === true
          }
          disabled={!permissions?.canConfigureOrganization}
        />
      ) : (
        <PermissionDeniedPage />
      )}
    </>
  );
};

export default withTranslation(GroupProfileContainer, [
  TranslationNamespace.Organization,
  TranslationNamespace.Groups,
  TranslationNamespace.Settings,
  TranslationNamespace.AssetPrivacy,
  TranslationNamespace.OwnershipTransfer,
  TranslationNamespace.SocialLinksAgeVerificationUpsell,
]);
