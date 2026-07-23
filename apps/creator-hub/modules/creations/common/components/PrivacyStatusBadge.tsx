import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, type ReactElement } from 'react';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import type { TBadgeVariant } from '@rbx/foundation-ui';
import { Badge, clsx, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useCoreContentTransactionStatus } from '@modules/audience-reach/hooks/useCoreContentTransactionStatus';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { CONTENT_UNRATED } from '@modules/experience-guidelines/hooks/useCreatorEligibility';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Audience, isPrivateAudience } from '../audiences';
import styles from './PrivacyStatusBadge.module.css';

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
  const useTranslationResult = useTranslation();
  const { translate } = useTranslationResult;
  const { tPendingTranslation } = useTranslationWrapper(useTranslationResult);
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

  let visibilityLabelKey = 'Label.Private';
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
      consolidatedLabel = translate('Label.Private');
    } else {
      const unrated = contentMaturity === CONTENT_UNRATED;

      if (unrated || isSequestered) {
        badgeType = 'unplayable';
        icon = 'icon-filled-circle-x';
        badgeVariant = 'Alert';
        consolidatedLabel = translate('Label.Unplayable');
      } else if (isDiscoveryBlocked) {
        badgeType = 'limitedDiscovery';
        icon = 'icon-filled-triangle-exclamation';
        activeIconColor = styles.iconWarning;
        consolidatedLabel = translate('Label.NeedsAttention');
      } else if (
        (ageRecommendation == null || ageRecommendation < NEEDS_ATTENTION_AGE_THRESHOLD) &&
        isSelect &&
        isSelectAtRisk &&
        !expeditedIsPaid
      ) {
        badgeType = 'needsAttention';
        icon = 'icon-filled-triangle-exclamation';
        badgeVariant = 'Warning';
        consolidatedLabel = translate('Label.NeedsAttention');
      } else if (isFriendsOnly) {
        badgeType = 'limited';
        icon = 'icon-filled-two-people';
        activeIconColor = styles.iconOk;
        consolidatedLabel = translate('Label.Limited');
        const isGroup = creatorType === SearchCreatorType.Group;
        if (enableAudiencesReplacement && audiences) {
          const hasPlayTesters = audiences.includes(Audience.PlayTesters);
          const hasFriends = audiences.includes(Audience.Friends);
          if (hasPlayTesters && hasFriends) {
            tooltipDescription = isGroup
              ? tPendingTranslation(
                  'Experience available to playtesters and community members',
                  'Tooltip on the Limited privacy pill when a group experience is open to internal playtesters and community members.',
                  translationKey(
                    'Tooltip.AudienceLimitedPlaytestersAndCommunity',
                    TranslationNamespace.Creations,
                  ),
                )
              : tPendingTranslation(
                  'Experience available to playtesters and friends',
                  "Tooltip on the Limited privacy pill when a user-owned experience is open to internal playtesters and the creator's friends.",
                  translationKey(
                    'Tooltip.AudienceLimitedPlaytestersAndFriends',
                    TranslationNamespace.Creations,
                  ),
                );
          } else if (hasPlayTesters) {
            tooltipDescription = tPendingTranslation(
              'Experience available to playtesters',
              'Tooltip on the Limited privacy pill when an experience is open to internal playtesters only.',
              translationKey('Tooltip.AudienceLimitedPlaytesters', TranslationNamespace.Creations),
            );
          } else if (hasFriends) {
            tooltipDescription = isGroup
              ? tPendingTranslation(
                  'Experience available to community members',
                  'Tooltip on the Limited privacy pill when a group experience is open to community members only.',
                  translationKey(
                    'Tooltip.AudienceLimitedCommunity',
                    TranslationNamespace.Creations,
                  ),
                )
              : tPendingTranslation(
                  'Experience available to friends',
                  "Tooltip on the Limited privacy pill when a user-owned experience is open to the creator's friends only.",
                  translationKey('Tooltip.AudienceLimitedFriends', TranslationNamespace.Creations),
                );
          }
        } else {
          tooltipDescription = isGroup
            ? translate('Tooltip.LimitedCommunity')
            : translate('Tooltip.LimitedFriends');
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
          ? translate('Label.PublicAgeGated', { minAge: displayAge })
          : translate('Label.PublicAllAges');
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
        statusSuffix = ` (${translate('Label.Select')})`;
        if (isSelectAtRisk) {
          badgeType = 'selectAtRisk';
          icon = 'icon-filled-triangle-exclamation';
          activeIconColor = styles.iconWarning;
        }
      } else if (isBeta) {
        badgeType = 'beta';
        statusSuffix = ` (${translate('Label.Beta')})`;
      }
    }

    consolidatedLabel = `${translate(visibilityLabelKey)}${statusSuffix}`;

    if (isUnrated) {
      tooltipTitle = translate('Title.UnratedPublicExperience');
      tooltipDescription = translate('Label.UnratedPublicExperience');
    } else if (isSelectEligible) {
      tooltipTitle = isSelectAtRisk
        ? translate('Tooltip.SelectEligibleAtRisk')
        : translate('Tooltip.SelectEligible');
      tooltipDescription = isSelectAtRisk
        ? translate('Description.SelectEligibleAtRisk')
        : translate('Description.SelectEligible');
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
    <div className={clsx(styles.badge, activeIconColor)}>
      <Badge
        label={
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Badge accepts ReactNode despite string type
          (
            <div className={styles.badgeLabelContainer}>{consolidatedLabel}</div>
          ) as unknown as string
        }
        icon={icon}
        variant={badgeVariant}
      />
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
