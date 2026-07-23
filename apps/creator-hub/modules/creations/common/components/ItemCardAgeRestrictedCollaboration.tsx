import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import NextLink from 'next/link';
import { Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Skeleton } from '@rbx/ui';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface ItemCardAgeRestrictedCollaborationProps {
  isLoading: boolean;
  universeId?: number;
}

const ItemCardAgeRestrictedCollaboration: FunctionComponent<
  React.PropsWithChildren<ItemCardAgeRestrictedCollaborationProps>
> = ({ isLoading, universeId }) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const trackCollaborateClick = useCallback(() => {
    if (!universeId) {
      return;
    }
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.ImpactedExperienceCardCollaborateClick,
      parameters: {
        page: 'creations',
        universeId: universeId.toString(),
      },
    });
  }, [unifiedLogger, universeId]);

  if (isLoading) {
    return (
      <Typography variant='body2' color='error'>
        <Skeleton width='60%' />
      </Typography>
    );
  }

  const collaboratorsHref = universeId
    ? `/dashboard/creations/experiences/${universeId}/safety/collaborators`
    : undefined;

  return (
    <Tooltip
      position='bottom-start'
      title={translate('Title.NeedsTrustedCollaboration')}
      description={translate('Label.AddTrustedFriendToCollaborate')}
      delayDurationMs={0}>
      <TooltipTrigger asChild>
        <span className='text-body-medium flex items-center content-system-alert'>
          {collaboratorsHref ? (
            <NextLink
              href={collaboratorsHref}
              onClick={trackCollaborateClick}
              className='no-underline hover:underline content-inherit flex items-center'>
              <Icon size='Small' name='icon-regular-lock-closed' />
              <span>{translate('Label.Collaborate')}</span>
            </NextLink>
          ) : (
            <span className='flex items-center'>
              <Icon size='Small' name='icon-regular-lock-closed' />
              <span>{translate('Label.Collaborate')}</span>
            </span>
          )}
        </span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default withTranslation(ItemCardAgeRestrictedCollaboration, [
  TranslationNamespace.Creations,
  TranslationNamespace.Home,
]);
