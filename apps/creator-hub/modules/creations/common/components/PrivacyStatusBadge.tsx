import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, type ReactElement } from 'react';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import type { TBadgeVariant } from '@rbx/foundation-ui';
import { Badge, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useCoreContentTransactionStatus } from '@modules/audience-reach/hooks/useCoreContentTransactionStatus';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { CONTENT_UNRATED } from '@modules/experience-guidelines/hooks/useCreatorEligibility';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Audience, isPrivateAudience } from '../audiences';
import styles from './PrivacyStatusBadge.module.css';

// This appeases the type checker for TranslateWithNamespace
type VisibilityLabelKey =
  | 'Label.Private'
  | 'Label.Unrated2'
  | 'Label.Community'
  | 'Label.PublicFriendsUserTitle'
  | 'Label.Public';

// Select-eligible experiences under this age threshold show "Needs Attention"
// because they risk losing Select status without a 16+ age recommendation.
const NEEDS_ATTENTION_AGE_THRESHOLD = 16;

export interface PrivacyStatusBadgeProps {
  universeId?: number;
  isActive?: boolean;
  isFriendsOnly?: boolean;
  audiences?: Audience[];
  creatorType?: SearchCreatorType;
  contentMaturity?: string;
  isBeta?: boolean;
  isSelect?: boolean;
  isSelectAtRisk?: boolean;
  useNewBadgePattern?: boolean;
  ageRecommendation?: number | null;
  isSequestered?: boolean;
  isDiscoveryBlocked?: boolean;
}

const PrivacyStatusBadge: FunctionComponent<PrivacyStatusBadgeProps> = ({
  universeId,
  isActive: isActiveProp = false,
  isFriendsOnly: isFriendsOnlyProp = false,
  audiences,
  creatorType,
  contentMaturity,
  isBeta = false,
  isSelect = false,
  isSelectAtRisk = false,
  useNewBadgePattern = false,
  ageRecommendation,
  isSequestered = false,
  isDiscoveryBlocked = false,
}) => {
  const { translateWithNamespace } = useTranslation();
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  // Audience -> badge category mapping (when enableAudiencesReplacement is on):
  //   [Editors]              -> Private
  //   includes Public        -> Public
  //   anything else          -> Limited
  const audienceIsPrivate = isPrivateAudience(audiences);
  const audienceIsPublic = !!audiences?.includes(Audience.Public);
  const audienceIsLimited = !(audienceIsPrivate || audienceIsPublic);
  const isActive = enableAudiencesReplacement ? !audienceIsPrivate : isActiveProp;
  const isFriendsOnly = enableAudiencesReplacement ? audienceIsLimited : isFriendsOnlyProp;
  // At the moment there is no batch endpoint to obtain the transaction status, so this
  // has to be done once per badge.
  const { data: expeditedTransactionStatus, isLoading: isTransactionsLoading } =
    useCoreContentTransactionStatus(universeId ?? 0, TransactionVariantEnum.Expedited);
  const expeditedIsPaid = expeditedTransactionStatus?.hasDeposit ?? false;

  let visibilityLabelKey: VisibilityLabelKey = 'Label.Private';
  let badgeType = 'private';
  let statusSuffix = '';
  let activeIconColor = styles.iconNeutral;
  let icon: TTailwindIconClass = 'icon-filled-lock-closed';
  let consolidatedLabel = '';
  let badgeVariant: TBadgeVariant | undefined;
  let tooltipTitle: string | undefined;
  let tooltipDescription: string | undefined;

  if (useNewBadgePattern) {
    if (!isActive) {
      badgeType = 'private';
      icon = 'icon-filled-lock-closed';
      activeIconColor = styles.iconNeutral;
      consolidatedLabel = translateWithNamespace(TranslationNamespace.Creations, 'Label.Private');
    } else {
      const unrated = contentMaturity === CONTENT_UNRATED;

      if (unrated || isSequestered) {
        badgeType = 'unplayable';
        icon = 'icon-filled-circle-x';
        badgeVariant = 'Alert';
        consolidatedLabel = translateWithNamespace(
          TranslationNamespace.Creations,
          'Label.Unplayable',
        );
      } else if (isDiscoveryBlocked) {
        badgeType = 'limitedDiscovery';
        icon = 'icon-filled-triangle-exclamation';
        activeIconColor = styles.iconWarning;
        consolidatedLabel = translateWithNamespace(
          TranslationNamespace.Creations,
          'Label.NeedsAttention',
        );
      } else if (
        (ageRecommendation == null || ageRecommendation < NEEDS_ATTENTION_AGE_THRESHOLD) &&
        isSelect &&
        isSelectAtRisk &&
        !expeditedIsPaid
      ) {
        badgeType = 'needsAttention';
        icon = 'icon-filled-triangle-exclamation';
        badgeVariant = 'Warning';
        consolidatedLabel = translateWithNamespace(
          TranslationNamespace.Creations,
          'Label.NeedsAttention',
        );
      } else if (isFriendsOnly) {
        badgeType = 'limited';
        icon = 'icon-filled-two-people';
        activeIconColor = styles.iconOk;
        consolidatedLabel = translateWithNamespace(TranslationNamespace.Creations, 'Label.Limited');
        const isGroup = creatorType === SearchCreatorType.Group;
        if (enableAudiencesReplacement && audiences) {
          const hasPlayTesters = audiences.includes(Audience.PlayTesters);
          const hasFriends = audiences.includes(Audience.Friends);
          if (hasPlayTesters && hasFriends) {
            tooltipDescription = isGroup
              ? translateWithNamespace(
                  TranslationNamespace.Creations,
                  'Tooltip.AudienceLimitedPlaytestersAndCommunity',
                )
              : translateWithNamespace(
                  TranslationNamespace.Creations,
                  'Tooltip.AudienceLimitedPlaytestersAndFriends',
                );
          } else if (hasPlayTesters) {
            tooltipDescription = translateWithNamespace(
              TranslationNamespace.Creations,
              'Tooltip.AudienceLimitedPlaytesters',
            );
          } else if (hasFriends) {
            tooltipDescription = isGroup
              ? translateWithNamespace(
                  TranslationNamespace.Creations,
                  'Tooltip.AudienceLimitedCommunity',
                )
              : translateWithNamespace(
                  TranslationNamespace.Creations,
                  'Tooltip.AudienceLimitedFriends',
                );
          }
        } else {
          tooltipDescription = isGroup
            ? translateWithNamespace(TranslationNamespace.Creations, 'Tooltip.LimitedCommunity')
            : translateWithNamespace(TranslationNamespace.Creations, 'Tooltip.LimitedFriends');
        }
      } else {
        badgeType = 'public';
        icon = 'icon-filled-globe-detailed';
        activeIconColor = styles.iconOk;
        const effectiveAge = isSelect
          ? (ageRecommendation ?? 0)
          : Math.max(NEEDS_ATTENTION_AGE_THRESHOLD, ageRecommendation ?? 0);
        let displayAge: string | undefined;
        if (effectiveAge >= NEEDS_ATTENTION_AGE_THRESHOLD) {
          displayAge = '16';
        } else if (effectiveAge >= 9) {
          displayAge = '9';
        }
        consolidatedLabel = displayAge
          ? translateWithNamespace(TranslationNamespace.Creations, 'Label.PublicAgeGated', {
              minAge: displayAge,
            })
          : translateWithNamespace(TranslationNamespace.Creations, 'Label.PublicAllAges');
      }
    }
  } else {
    const isUnrated = isActive && contentMaturity === CONTENT_UNRATED;
    const isSelectEligible = isActive && isSelect;

    visibilityLabelKey = 'Label.Private';
    badgeType = 'private';
    statusSuffix = '';

    if (!isActive) {
      // defaults above handle private state
    } else if (isUnrated) {
      visibilityLabelKey = 'Label.Unrated2';
      badgeType = 'unrated';
      icon = 'icon-filled-circle-x';
      activeIconColor = styles.iconError;
    } else {
      if (isFriendsOnly) {
        if (creatorType === SearchCreatorType.Group) {
          visibilityLabelKey = 'Label.Community';
          badgeType = 'community';
        } else {
          visibilityLabelKey = 'Label.PublicFriendsUserTitle';
          badgeType = 'friends';
        }
      } else {
        visibilityLabelKey = 'Label.Public';
        badgeType = 'public';
      }
      icon = 'icon-filled-globe-detailed';
      activeIconColor = styles.iconOk;

      if (isSelectEligible) {
        badgeType = 'select';
        statusSuffix = ` (${translateWithNamespace(TranslationNamespace.Creations, 'Label.Select')})`;
        if (isSelectAtRisk) {
          badgeType = 'selectAtRisk';
          icon = 'icon-filled-triangle-exclamation';
          activeIconColor = styles.iconWarning;
        }
      } else if (isBeta) {
        badgeType = 'beta';
        statusSuffix = ` (${translateWithNamespace(TranslationNamespace.Creations, 'Label.Beta')})`;
      }
    }

    consolidatedLabel = `${translateWithNamespace(TranslationNamespace.Creations, visibilityLabelKey)}${statusSuffix}`;

    if (isUnrated) {
      tooltipTitle = translateWithNamespace(
        TranslationNamespace.Creations,
        'Title.UnratedPublicExperience',
      );
      tooltipDescription = translateWithNamespace(
        TranslationNamespace.Creations,
        'Label.UnratedPublicExperience',
      );
    } else if (isSelectEligible) {
      tooltipTitle = isSelectAtRisk
        ? translateWithNamespace(TranslationNamespace.Creations, 'Tooltip.SelectEligibleAtRisk')
        : translateWithNamespace(TranslationNamespace.Creations, 'Tooltip.SelectEligible');
      tooltipDescription = isSelectAtRisk
        ? translateWithNamespace(TranslationNamespace.Creations, 'Description.SelectEligibleAtRisk')
        : translateWithNamespace(TranslationNamespace.Creations, 'Description.SelectEligible');
    }
  }

  const impressionLogged = useRef(false);
  useEffect(() => {
    if (impressionLogged.current || isTransactionsLoading) {
      return;
    }
    impressionLogged.current = true;
    unifiedLoggerClient.logImpressionEvent({
      eventName: CreatorDashboardEventType.StatusBadgeImpression,
      parameters: {
        badgeType,
        ...(universeId && { universeId: universeId.toString() }),
      },
    });
  }, [badgeType, universeId, isTransactionsLoading]);

  const handleTooltipOpen = useCallback(() => {
    unifiedLoggerClient.logClickEvent({
      eventName: CreatorDashboardEventType.StatusBadgeTooltipOpen,
      parameters: {
        badgeType,
        ...(universeId && { universeId: universeId.toString() }),
      },
    });
  }, [badgeType, universeId]);

  const badge: ReactElement = (
    <div className={activeIconColor}>
      <Badge label={consolidatedLabel} icon={icon} variant={badgeVariant} />
    </div>
  );

  if (isTransactionsLoading) {
    return null;
  }

  if (tooltipDescription) {
    return (
      <div className={styles.tooltipWrapper}>
        <Tooltip
          position='bottom-center'
          title={tooltipTitle ?? ''}
          description={tooltipDescription}
          delayDurationMs={0}>
          <TooltipTrigger asChild>
            <span onPointerEnter={handleTooltipOpen}>{badge}</span>
          </TooltipTrigger>
        </Tooltip>
      </div>
    );
  }

  return badge;
};

export default PrivacyStatusBadge;
