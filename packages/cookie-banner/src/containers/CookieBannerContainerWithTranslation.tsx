import { withTranslation } from "@rbx/intl";
import CookieBannerContainer from "./CookieBannerContainer";
import { REQUIRED_TRANSLATION_NAMESPACES } from "../constants";

const CookieBannerContainerWithTranslation = withTranslation(
  CookieBannerContainer,
  REQUIRED_TRANSLATION_NAMESPACES
);

export default CookieBannerContainerWithTranslation;
