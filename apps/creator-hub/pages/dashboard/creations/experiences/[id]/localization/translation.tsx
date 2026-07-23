import type { NextLayoutPage } from 'next';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import TranslationMetadataContainer from '@modules/localization/translation/container/TranslationMetadataContainer';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import getTranslationPersistentLayout from '@modules/localization/translation/utils/getTranslationPersistentLayout';
import Authenticated from '@modules/authentication/Authenticated';

const Translation: NextLayoutPage = () => {
  return (
    <Authenticated>
      <TranslationMetadataContainer />
    </Authenticated>
  );
};
Translation.getPageLayout = (page) =>
  getTranslationPersistentLayout(page, { title: 'Heading.Translation' });

export default Translation;
