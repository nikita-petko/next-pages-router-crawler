import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
import { PASS_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ButtonLink } from '@modules/monetization-shared/button-link';
import { Link } from '@modules/monetization-shared/link';
import { ARCHIVE_VIEWS, useView } from '@modules/monetization-shared/views/useView';
import CreatePassButton from './common/CreatePassButton';

type Props = {
  universeId: number;
  /** When false or undefined, the archive flag is off and the legacy empty state renders. */
  isArchiveEnabled?: boolean;
  /** When true, shows the archived-view empty state (no create CTA). */
  showArchived?: boolean;
};

function PassesTableEmptyState({ universeId, isArchiveEnabled, showArchived }: Props) {
  const { translate, translateHTML, translateWithNamespace } = useTranslation();
  const { setView } = useView(ARCHIVE_VIEWS);

  // The redesigned empty state points creators at the archive, so it ships with that feature.
  if (!isArchiveEnabled) {
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

  if (showArchived) {
    return (
      <EmptyState
        size='small'
        illustration='experiences'
        title={translateWithNamespace(
          TranslationNamespace.Creations,
          'Heading.NoArchivedCreations',
        )}
        description={translateWithNamespace(
          TranslationNamespace.Creations,
          'Description.NoArchivedCreations',
        )}>
        <Button variant='Standard' size='Medium' onClick={() => setView('current')}>
          {translateWithNamespace(TranslationNamespace.Creations, 'Action.ViewCurrentCreations')}
        </Button>
      </EmptyState>
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
