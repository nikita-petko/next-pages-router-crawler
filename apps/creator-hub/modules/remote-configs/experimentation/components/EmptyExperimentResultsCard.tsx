import React from 'react';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { useTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ValidExperiment } from '../../api/validExperimentationTypes';
import StartExperimentButton from './StartExperimentButton';

type EmptyExperimentResultsCardProps = {
  experiment: ValidExperiment;
};

const EmptyExperimentResultsCard = ({ experiment }: EmptyExperimentResultsCardProps) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate(
          translationKey(
            'Title.EmptyExperimentDetails',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        description={translateHTML(
          translationKey(
            'Description.EmptyExperimentDetails',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        size='large'
        illustration='emptyExperiments'>
        <StartExperimentButton experiment={experiment} color='inherit' />
      </EmptyState>
    </EmptyStateBorder>
  );
};

export default EmptyExperimentResultsCard;
