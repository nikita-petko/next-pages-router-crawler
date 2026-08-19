import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';

type ShowcasesEmptyStateProps = {
  onCreateClick?: () => void;
  isCreateDisabled?: boolean;
};

const ShowcasesEmptyState = ({
  onCreateClick,
  isCreateDisabled = false,
}: ShowcasesEmptyStateProps) => {
  const { translate } = useTranslation();

  return (
    <EmptyState
      title={translate('Heading.ReachMoreShoppers')}
      size='large'
      illustration='avatarItem'
      description={translate('Description.ShowcasesEmptyState')}>
      <Button
        variant='Emphasis'
        size='Large'
        type='button'
        // The create page lands in a follow-up, so treat a missing handler as
        // disabled rather than rendering a button that silently does nothing.
        isDisabled={isCreateDisabled || !onCreateClick}
        onClick={onCreateClick}>
        {translate('Action.CreateShowcase')}
      </Button>
    </EmptyState>
  );
};

export default ShowcasesEmptyState;
