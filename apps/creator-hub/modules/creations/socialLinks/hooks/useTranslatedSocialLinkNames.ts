import { useTranslation } from '@rbx/intl';
import type { SocialLinkTypes } from '@modules/clients/games';
import { SocialLinkNameTranslationKeys } from '../constants';

export default function useTranslatedSocialLinkNames() {
  const { translate } = useTranslation();
  return {
    getTranslatedSocialLinkName: (linkType: SocialLinkTypes) => {
      return SocialLinkNameTranslationKeys[linkType]
        ? translate(SocialLinkNameTranslationKeys[linkType])
        : linkType;
    },
  };
}
