import { memo } from 'react';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';

// TODO: move to central URLs
const avatarItemsDocLink = '/docs/production/monetization/avatar-items';

function AvatarItemsPageTitle() {
  const { universeId } = useUniverseId();

  if (!universeId) {
    return null;
  }

  return (
    <PageTitle
      titleKey='Label.ThirdPartyAvatarItemCommissions'
      titleNamespace={TranslationNamespace.Navigation}
      subtitleKey='Description.TakeActionAvatarItemCommissions'
      subtitleNamespace={TranslationNamespace.Analytics}
      subtitleLink={avatarItemsDocLink}
    />
  );
}

export default memo(AvatarItemsPageTitle);
