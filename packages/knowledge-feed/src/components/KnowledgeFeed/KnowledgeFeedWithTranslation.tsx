import { withTranslation } from '@rbx/intl';
import TranslationNamespace from '../../constants/TranslationNamespace';
import KnowledgeFeed from './KnowledgeFeed';

export default withTranslation(KnowledgeFeed, [
  TranslationNamespace.CreatorHubHome,
  TranslationNamespace.CreatorDocumentationHome,
]);
