import { Button } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type FreeAvatarsEmptyStateProps = {
  onAddAvatars: () => void;
};

function FreeAvatarsEmptyState({ onAddAvatars }: FreeAvatarsEmptyStateProps) {
  const { translate } = useTranslation();

  return (
    <EmptyState
      size='small'
      illustration='avatarItem'
      title={translate('Label.EmptyStateFreeAvatar')}
      description={translate('Description.EmptyStateFreeAvatar')}>
      <Button
        variant='Emphasis'
        size='Large'
        type='button'
        data-testid='freeAvatarsAddAvatarsButton'
        onClick={onAddAvatars}>
        {translate('Action.AddAvatars')}
      </Button>
    </EmptyState>
  );
}

export default withTranslation(FreeAvatarsEmptyState, [TranslationNamespace.Creations]);
