import { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Skeleton } from '@rbx/ui';
import { Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import NextLink from 'next/link';

export interface ItemCardAgeRestrictedCollaborationProps {
  isLoading: boolean;
  universeId?: number;
}

const ItemCardAgeRestrictedCollaboration: FunctionComponent<
  React.PropsWithChildren<ItemCardAgeRestrictedCollaborationProps>
> = ({ isLoading, universeId }) => {
  const { translate } = useTranslation();
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
      position='bottom-center'
      title={translate('Title.NeedsTrustedCollaboration')}
      description={translate('Label.AddTrustedConnectionToCollaborate')}
      delayDurationMs={0}>
      <TooltipTrigger asChild>
        <span className='text-body-medium flex items-center content-system-alert'>
          {collaboratorsHref ? (
            <NextLink
              href={collaboratorsHref}
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
