import { useRouter } from 'next/router';
import { Button } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { logProductArchiveClick } from '@modules/monetization-shared/archive-dialog/logging';
import { openGamePassArchiveDialog } from '@modules/passes/components/GamePassArchiveDialog';

type Props = {
  universeId: number;
  passId: number;
  isArchived: boolean;
  isDisabled?: boolean;
};

export function GamePassArchiveButton({ universeId, passId, isArchived, isDisabled }: Props) {
  const { push } = useRouter();
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Creations);

  const handleClick = () => {
    logProductArchiveClick({
      productType: 'gamePass',
      itemId: passId,
      universeId,
      isArchived,
    });
    openGamePassArchiveDialog({
      universeId,
      gamePassId: passId,
      isArchived,
      onSuccess: () => {
        void push(dashboard.getMonetizationPassesUrl(universeId));
      },
    });
  };

  return (
    <Button
      type='button'
      variant='Standard'
      size='Large'
      className='padding-x-xlarge'
      onClick={handleClick}
      isDisabled={isDisabled}>
      {isArchived ? translate('Action.Unarchive') : translate('Action.Archive')}
    </Button>
  );
}
