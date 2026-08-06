import { useTranslation } from '@rbx/intl';
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
import { PASS_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ButtonLink } from '@modules/monetization-shared/button-link';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { Link } from '@modules/monetization-shared/link';
import CreatePassButton from './common/CreatePassButton';

type Props = {
  universeId: number;
};

function PassesTableEmptyState({ universeId }: Props) {
  const { translate, translateHTML, translateWithNamespace } = useTranslation();
  const { isProductArchiveEnabled } = useMonetizationFlags('isProductArchiveEnabled');

  // The redesigned empty state points creators at the archive, so it ships with that feature.
  if (!isProductArchiveEnabled) {
    return (
      <ItemGridEmptyView
        createItemButton={<CreatePassButton universeId={universeId} />}
        emptyMessage={translate('Message.EmptyMessage', {
          itemType: translate('Label.GamePasses'),
        })}
        itemDescription={translateHTML(
          'Message.EmptyMessagesWithLink',
          [
            {
              opening: 'LinkStart',
              closing: 'LinkEnd',
              content(chunks) {
                return (
                  <Link href={PASS_LEARN_MORE_URL} target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
          { itemType: translate('Label.GamePasses') },
        )}
      />
    );
  }

  return (
    <EmptyState
      size='small'
      illustration='experiences'
      title={translateWithNamespace(TranslationNamespace.Creations, 'Heading.CurrentListEmpty')}
      description={translateWithNamespace(
        TranslationNamespace.Passes,
        'Description.CurrentListEmpty',
      )}>
      <ButtonLink
        variant='Standard'
        size='Medium'
        data-testid='createAssociatedItemsButton' // Keep this for legacy tests
        href={dashboard.getCreatePassUrl(universeId)}>
        {translateWithNamespace(TranslationNamespace.Passes, 'Action.CreatePass')}
      </ButtonLink>
    </EmptyState>
  );
}

export default PassesTableEmptyState;
