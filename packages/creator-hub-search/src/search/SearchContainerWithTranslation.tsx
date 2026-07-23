import { withTranslation } from '@rbx/intl';
import { REQUIRED_TRANSLATION_NAMESPACES } from '../localization/TranslationNamespace';
import SearchContainer from './SearchContainer';

/**
 * SearchContainer wrapped with translation support.
 * This is the recommended export for consumers - translations are handled internally.
 */
export default withTranslation(SearchContainer, REQUIRED_TRANSLATION_NAMESPACES);
