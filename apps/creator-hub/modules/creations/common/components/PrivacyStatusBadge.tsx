import { FunctionComponent, useCallback, useEffect, useRef, type ReactElement } from 'react';
import { Badge, clsx, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { useTranslation } from '@rbx/intl';
import NextLink from 'next/link';
import { CONTENT_UNRATED } from '@modules/experience-guidelines/hooks/useCreatorEligibility';
import { SearchCreatorType } from '@rbx/clients/universesApi';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useSettings } from '@modules/settings';
import styles from './PrivacyStatusBadge.module.css';

export interface PrivacyStatusBadgeProps {
  universeId?: number;
  isActive?: boolean;
  isFriendsOnly?: boolean;
  creatorType?: SearchCreatorType;
  contentMaturity?: string;
  isBeta?: boolean;
  isSelect?: boolean;
  isSelectAtRisk?: boolean;
}

const PrivacyStatusBadge: FunctionComponent<PrivacyStatusBadgeProps> = ({
  universeId,
  isActive = false,
  isFriendsOnly = false,
  creatorType,
  contentMaturity,
  isBeta = false,
  isSelect = false,
  isSelectAtRisk = false,
}) => {
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const enablePublishingPermissions = settings.enableCoreContentStatusLabelLink;

  const isUnrated = isActive && contentMaturity === CONTENT_UNRATED;
  const isSelectEligible = isActive && isSelect && enablePublishingPermissions;

  let visibilityLabelKey = 'Label.Private';
  let badgeType = 'private';
  let statusSuffix = '';
  let activeIconColor = styles.iconNeutral;
  let icon: TTailwindIconClass = 'icon-filled-lock-closed';

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
        visibilityLabelKey = 'Label.PublicConnectionsUser';
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

  const consolidatedLabel = `${translate(visibilityLabelKey)}${statusSuffix}`;

  let tooltipTitle: string | undefined;
  let tooltipDescription: string | undefined;
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

  const impressionLogged = useRef(false);
  useEffect(() => {
    if (impressionLogged.current) return;
    impressionLogged.current = true;
    unifiedLoggerClient.logImpressionEvent({
      eventName: CreatorDashboardEventType.StatusBadgeImpression,
      parameters: {
        badgeType,
        ...(universeId && { universeId: universeId.toString() }),
      },
    });
  }, [badgeType, universeId]);

  let href: string | undefined;
  if (universeId) {
    if (isUnrated) {
      href = `/dashboard/creations/experiences/${universeId}/experience-questionnaire`;
    } else if (isSelectEligible) {
      href = `/dashboard/creations/experiences/${universeId}/analytics/select-eligibility`;
    }
  }

  const handleBadgeClick = useCallback(() => {
    unifiedLoggerClient.logClickEvent({
      eventName: CreatorDashboardEventType.StatusBadgeClick,
      parameters: {
        badgeType,
        ...(universeId && { universeId: universeId.toString() }),
        ...(href && { destination: href }),
      },
    });
  }, [badgeType, universeId, href]);

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
          (
            <div className={styles.badgeLabelContainer}>{consolidatedLabel}</div>
          ) as unknown as string
        }
        icon={icon}
      />
    </div>
  );

  const linkedBadge = href ? (
    <NextLink href={href} className={styles.badgeLink} onClick={handleBadgeClick}>
      {badge}
    </NextLink>
  ) : (
    badge
  );

  if (tooltipTitle) {
    return (
      <div className={styles.tooltipWrapper}>
        <Tooltip
          position='bottom-center'
          title={tooltipTitle}
          description={tooltipDescription}
          delayDurationMs={0}>
          <TooltipTrigger asChild>
            <span onPointerEnter={handleTooltipOpen}>{linkedBadge}</span>
          </TooltipTrigger>
        </Tooltip>
      </div>
    );
  }

  return linkedBadge;
};

export default PrivacyStatusBadge;
