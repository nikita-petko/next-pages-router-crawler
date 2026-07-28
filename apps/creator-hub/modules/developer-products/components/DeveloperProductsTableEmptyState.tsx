import { useTranslation } from '@rbx/intl';
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
import { DEVELOPER_PRODUCT_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import { Link } from '@modules/monetization-shared/link';
import CreateDeveloperProductButton from './common/CreateDeveloperProductButton';

type Props = {
  universeId: number;
};

function DeveloperProductsTableEmptyState({ universeId }: Props) {
  const { translate, translateHTML } = useTranslation();

  return (
    <ItemGridEmptyView
      createItemButton={<CreateDeveloperProductButton universeId={universeId} />}
      emptyMessage={translate('Message.EmptyMessage', {
        itemType: translate('Label.DeveloperProducts'),
      })}
      itemDescription={translateHTML(
        'Message.EmptyMessagesWithLink',
        [
          {
            opening: 'LinkStart',
            closing: 'LinkEnd',
            content(chunks) {
              return (
                <Link href={DEVELOPER_PRODUCT_LEARN_MORE_URL} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ],
        { itemType: translate('Label.DeveloperProducts') },
      )}
    />
  );
}

export default DeveloperProductsTableEmptyState;
