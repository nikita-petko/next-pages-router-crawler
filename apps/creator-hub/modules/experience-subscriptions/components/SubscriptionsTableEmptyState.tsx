import { useTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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
