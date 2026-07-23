import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';

const ExperimentTypeTranslationKeys: Record<ExperimentProductType, TranslationKey> = {
  [ExperimentProductType.Configs]: translationKey(
    'Label.ExperimentProductType.Configs',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentProductType.Matchmaking]: translationKey(
    'Label.ExperimentProductType.Matchmaking',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
};

export default ExperimentTypeTranslationKeys;
