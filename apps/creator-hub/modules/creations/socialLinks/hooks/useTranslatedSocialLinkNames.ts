import { useTranslation } from '@rbx/intl';
import { SocialLinkTypes } from '@modules/clients';
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
