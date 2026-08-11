import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

function JourneysConfigPageTitle() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { pathname } = useRouter();
  const isEdit = pathname.endsWith('/edit');

  const title = isEdit
    ? tPendingTranslation(
        'Edit Journey',
        'Page heading for the journey config edit form',
        translationKey('Heading.EditJourney', TranslationNamespace.Analytics),
      )
    : tPendingTranslation(
        'Create Journey',
        'Page heading for the journey config creation form',
        translationKey('Heading.CreateJourney', TranslationNamespace.Analytics),
      );

  return <h1 className='text-heading-large margin-none'>{title}</h1>;
}

export default withTranslation(JourneysConfigPageTitle, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
]);
