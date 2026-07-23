import React from 'react';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyState } from '@modules/miscellaneous/common/components';

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
