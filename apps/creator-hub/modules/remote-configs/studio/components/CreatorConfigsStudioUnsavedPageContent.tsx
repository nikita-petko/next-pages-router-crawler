import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const EmptyStudioWidget = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const title = translate(
    translationKey(
      'Title.StudioEmptyUnsaved',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const subtitle = translate(
    translationKey(
      'Description.StudioEmptyUnsaved',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  return (
    <div className='size-full relative'>
      <EmptyState illustration='signin' title={title} description={subtitle} />
    </div>
  );
};

const CreatorConfigsStudioUnsavedPageContent = () => {
  return <EmptyStudioWidget />;
};

export default withNamespaceSwitchedTranslation(CreatorConfigsStudioUnsavedPageContent, [
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
