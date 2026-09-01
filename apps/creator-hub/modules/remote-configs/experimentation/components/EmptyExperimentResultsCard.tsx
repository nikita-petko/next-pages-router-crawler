import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ValidExperiment } from '../../api/validExperimentationTypes';
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
