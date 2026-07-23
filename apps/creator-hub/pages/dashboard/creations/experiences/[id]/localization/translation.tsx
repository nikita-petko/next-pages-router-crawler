import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import TranslationMetadataContainer from '@modules/localization/translation/container/TranslationMetadataContainer';
import getTranslationPersistentLayout from '@modules/localization/translation/utils/getTranslationPersistentLayout';

const Translation: NextLayoutPage = () => {
  return (
    <Authenticated>
      <TranslationMetadataContainer />
    </Authenticated>
  );
};
Translation.getPageLayout = (page) =>
  getTranslationPersistentLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Translation' />
    ),
  });
Translation.loggerConfig = { rosId: RosTeams.Localization };

export default Translation;
