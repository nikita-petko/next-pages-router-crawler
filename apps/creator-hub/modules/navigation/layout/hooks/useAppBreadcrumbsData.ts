import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import type {
  getDisplayNameParams,
  getLinkPathParams,
} from '../constants/BreadcrumbsItemConstants';
import useNavigationItemGroupState from './useNavigationItemGroupState';

export default function useAppBreadcrumbsData() {
  const { translate } = useTranslation();
  const { shouldUseV2: enableQuestionnaireV2 } = useQuestionnaireV2Gate();
  const {
    itemNameMapping,
    currentItemType,
    currentItemGroupId,
    isCurrentItemLoading,
    id,
    badgeId,
    passId,
    groupId,
    assetId,
    bundleId,
    experienceSubscriptionId,
    lookId,
    developerItemDetails,
    experimentId,
    environmentId,
  } = useNavigationItemGroupState();

  const displayNameParam: getDisplayNameParams = useMemo(() => {
    return {
      translate,
      itemType: currentItemType,
      enableQuestionnaireV2,
    };
  }, [currentItemType, enableQuestionnaireV2, translate]);

  const pathLinkParams: getLinkPathParams = useMemo(() => {
    return {
      baseId: id?.toString(),
      badgeId: badgeId?.toString(),
      passId,
      groupId:
        groupId?.toString() ?? (currentItemGroupId ? currentItemGroupId.toString() : undefined),
      assetId,
      bundleId,
      developerItemId: developerItemDetails?.id ?? undefined,
      associatedItemType: currentItemType,
      experienceSubscriptionId,
      environmentId: environmentId ?? undefined,
      experimentId: experimentId ?? undefined,
      lookId: lookId ?? undefined,
    } satisfies getLinkPathParams;
  }, [
    id,
    badgeId,
    passId,
    groupId,
    currentItemGroupId,
    assetId,
    bundleId,
    developerItemDetails?.id,
    currentItemType,
    experienceSubscriptionId,
    environmentId,
    experimentId,
    lookId,
  ]);

  return {
    itemNameMapping,
    pathLinkParams,
    displayNameParam,
    currentItemType,
    currentItemGroupId,
    isCurrentItemLoading,
  };
}
