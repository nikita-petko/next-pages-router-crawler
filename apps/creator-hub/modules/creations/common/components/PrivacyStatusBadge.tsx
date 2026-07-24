import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import type { TBadgeVariant } from '@rbx/foundation-ui';
import { Badge, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useCoreContentTransactionStatus } from '@modules/audience-reach/hooks/useCoreContentTransactionStatus';
import { TransactionVariantEnum } from '@modules/clients/coreContentTransactions';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { CONTENT_UNRATED } from '@modules/experience-guidelines/hooks/useCreatorEligibility';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Audience, isPrivateAudience } from '../audiences';

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

// Hide tooltips when most of the badge is clipped (e.g. under sticky nav / carousel overflow).
const TOOLTIP_VISIBILITY_THRESHOLD = 0.5;

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
  useNewBadgePattern: enableNewBadgePattern = false,
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
  let icon: TTailwindIconClass = 'icon-filled-lock-closed';
  let consolidatedLabel = '';
  let badgeVariant: TBadgeVariant = 'Standard';
  let tooltipTitle: string | undefined;
  let tooltipDescription: string | undefined;

  if (enableNewBadgePattern) {
    if (!isActive) {
      badgeType = 'private';
      icon = 'icon-filled-lock-closed';
      consolidatedLabel = translateWithNamespace(TranslationNamespace.Creations, 'Label.Private');
    } else {
      const unrated = contentMaturity === CONTENT_UNRATED;

      if (unrated || isSequestered) {
        badgeType = 'unplayable';
        icon = 'icon-filled-globe-detailed';
        badgeVariant = 'Alert';
        consolidatedLabel = translateWithNamespace(
          TranslationNamespace.Creations,
          'Label.Unplayable',
        );
        tooltipDescription = translateWithNamespace(
          TranslationNamespace.Creations,
          'Tooltip.PubliclyUnavailable',
        );
      } else if (isDiscoveryBlocked) {
        badgeType = 'limitedDiscovery';
        icon = 'icon-filled-triangle-exclamation';
        badgeVariant = 'Warning';
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
      badgeVariant = 'Alert';
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

      if (isSelectEligible) {
        badgeType = 'select';
        statusSuffix = ` (${translateWithNamespace(TranslationNamespace.Creations, 'Label.Select')})`;
        if (isSelectAtRisk) {
          badgeType = 'selectAtRisk';
          icon = 'icon-filled-triangle-exclamation';
          badgeVariant = 'Warning';
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
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isTriggerMostlyVisible, setIsTriggerMostlyVisible] = useState(true);

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

  useEffect(() => {
    if (isTransactionsLoading || !tooltipDescription) {
      return undefined;
    }
    const trigger = triggerRef.current;
    if (!trigger || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const mostlyVisible = entry.intersectionRatio >= TOOLTIP_VISIBILITY_THRESHOLD;
        setIsTriggerMostlyVisible(mostlyVisible);
        if (!mostlyVisible) {
          setIsTooltipOpen(false);
        }
      },
      { threshold: [0, TOOLTIP_VISIBILITY_THRESHOLD, 1] },
    );
    observer.observe(trigger);
    return () => {
      observer.disconnect();
    };
  }, [isTransactionsLoading, tooltipDescription]);

  const handleTooltipOpenChange = useCallback(
    (open: boolean) => {
      if (open && !isTriggerMostlyVisible) {
        return;
      }
      setIsTooltipOpen(open);
      if (open) {
        unifiedLoggerClient.logClickEvent({
          eventName: CreatorDashboardEventType.StatusBadgeTooltipOpen,
          parameters: {
            badgeType,
            ...(universeId && { universeId: universeId.toString() }),
          },
        });
      }
    },
    [badgeType, isTriggerMostlyVisible, universeId],
  );

  const badge: ReactElement = (
    <Badge label={consolidatedLabel} icon={icon} variant={badgeVariant} />
  );

  if (isTransactionsLoading) {
    return null;
  }

  if (tooltipDescription) {
    return (
      <div className='[&_[data-radix-popper-content-wrapper]]:![z-index:1500]'>
        <Tooltip
          position='top-center'
          title={tooltipTitle ?? ''}
          description={tooltipDescription}
          delayDurationMs={0}
          open={isTooltipOpen}
          onOpenChange={handleTooltipOpenChange}>
          <TooltipTrigger asChild>
            <span ref={triggerRef}>{badge}</span>
          </TooltipTrigger>
        </Tooltip>
      </div>
    );
  }

  return badge;
};

export default PrivacyStatusBadge;
