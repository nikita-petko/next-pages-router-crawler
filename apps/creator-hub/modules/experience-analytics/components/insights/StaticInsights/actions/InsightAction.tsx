import type { FC, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Button, Link, useMediaQuery } from '@rbx/ui';
import { StaticInsightType } from '@modules/clients/analytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useCopyUniverseLink from './useCopyUniverseLink';
import useStudioEditPlaceLauncher from './useStudioEditPlaceLauncher';

export enum InsightActionType {
  LinkToDoc = 'Doc',
  EditInStudio = 'EditInStudio',
  CopyLink = 'CopyLink',
}

export const hideInMobile = new Set<StaticInsightType>([StaticInsightType.OnboardRegularUpdates]);

const ONBOARD_CORE_LOOP_DOC_LINK = '/docs/production/analytics/retention#improving-day-1-retention';

type InsightActionProps = {
  insightType: StaticInsightType;
  actionText: ReactNode;
};

const InsightAction: FC<InsightActionProps> = ({ insightType, actionText }) => {
  const { id: universeId } = useUniverseResource();
  const hideActionOnMobile = hideInMobile.has(insightType) ?? false;
  const { isLoading: isCopyLinkLoading, copyLink } = useCopyUniverseLink(universeId);
  const {
    isLoading: isEditInStudioLoading,
    launch: launchStudio,
    dialog: studioDialog,
  } = useStudioEditPlaceLauncher(universeId);

  // 'md' is used here because tablets should not display the actions if insight type is configured to hide.
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const renderLink = useCallback(
    (actionLink: string) => (
      <Link data-testid='actionLink' href={actionLink}>
        <Button color='secondary' size='small' variant='text'>
          {actionText}
        </Button>
      </Link>
    ),
    [actionText],
  );

  const renderButton = useCallback(
    (isLoading: boolean, onButtonClick: () => Promise<void>) => (
      <Button
        disabled={isLoading}
        data-testid='actionButton'
        color='secondary'
        size='small'
        variant='text'
        onClick={() => {
          onButtonClick();
        }}>
        {actionText}
      </Button>
    ),
    [actionText],
  );

  if (isCompactView && hideActionOnMobile) {
    return null;
  }

  switch (insightType) {
    case StaticInsightType.OnboardImproveCoreLoop: {
      return renderLink(ONBOARD_CORE_LOOP_DOC_LINK);
    }
    case StaticInsightType.OnboardRegularUpdates: {
      return (
        <>
          {renderButton(isEditInStudioLoading, launchStudio)}
          {studioDialog}
        </>
      );
    }
    case StaticInsightType.OnboardInviteUsers: {
      return renderButton(isCopyLinkLoading, copyLink);
    }
    default: {
      const exhaustiveCheck: never = insightType;
      throw new Error(`Unhandled insight type ${exhaustiveCheck}`);
    }
  }
};

export default InsightAction;
