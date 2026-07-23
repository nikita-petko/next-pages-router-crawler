import { useTranslation } from '@rbx/intl';
// eslint-disable-next-line no-restricted-imports -- need specific import
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';

function SubscriptionsTableEmptyState() {
  const { translate } = useTranslation();

  return (
    <ItemGridEmptyView
      createItemButton={null}
      emptyMessage={translate('Message.EmptyMessage', {
        itemType: translate(
          translationKey('Label.Subscriptions', TranslationNamespace.ExperienceSubscriptions).key,
        ),
      })}
      itemDescription={translate('Message.EmptySubscriptionsDescription', {
        defaultValue: 'Create subscriptions to monetize your experience.',
      })}
    />
  );
}

export default SubscriptionsTableEmptyState;
