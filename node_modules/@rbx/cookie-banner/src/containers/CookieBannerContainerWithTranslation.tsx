import { withTranslation } from '@rbx/intl';
import { REQUIRED_TRANSLATION_NAMESPACES } from '../constants';
import CookieBannerContainer from './CookieBannerContainer';

const CookieBannerContainerWithTranslation = withTranslation(
  CookieBannerContainer,
  REQUIRED_TRANSLATION_NAMESPACES,
);

export default CookieBannerContainerWithTranslation;
