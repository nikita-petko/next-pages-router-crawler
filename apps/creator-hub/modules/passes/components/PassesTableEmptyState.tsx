import { useTranslation } from '@rbx/intl';
import { Link } from '@rbx/ui';
// eslint-disable-next-line no-restricted-imports -- need specific import
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
import { PASS_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import CreatePassButton from './common/CreatePassButton';

type Props = {
  universeId: number;
};

function PassesTableEmptyState({ universeId }: Props) {
  const { translate, translateHTML } = useTranslation();

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

export default PassesTableEmptyState;
