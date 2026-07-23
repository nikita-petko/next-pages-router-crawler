import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentApiErrorType } from '../api/universeExperimentationClientEnums';

const ExperimentOperationErrorTranslationKey: Record<ExperimentApiErrorType, TranslationKey> = {
  [ExperimentApiErrorType.SystemError]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.Invalid]: translationKey(
    'Label.Error.ExperimentOperation.InvalidExperimentType',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.InvalidVariantConfiguration]: translationKey(
    'Label.Error.ExperimentOperation.InvalidVariantConfiguration',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.InvalidVariantLabel]: translationKey(
    'Label.Error.ExperimentOperation.InvalidVariantLabel',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.MustHaveExactlyOneBaselineVariant]: translationKey(
    'Label.Error.ExperimentOperation.MustHaveExactlyOneBaselineVariant',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.ConfigsMissingVariant]: translationKey(
    'Label.Error.ExperimentOperation.ConfigsMissingVariant',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.ConfigsVariantMissingKey]: translationKey(
    'Label.Error.ExperimentOperation.ConfigsVariantMissingKey',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.ConfigsVariantMissingValue]: translationKey(
    'Label.Error.ExperimentOperation.ConfigsVariantMissingValue',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.ConfigsKeyAlreadyInUse]: translationKey(
    'Label.Error.ExperimentOperation.ConfigsKeyAlreadyInUse',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),

  // MM errors handling: (@matchmaking)
  // specific backend errors to show to users
  [ExperimentApiErrorType.MatchmakingOverlappingRuntime]: translationKey(
    'Label.Error.ExperimentOperation.MatchmakingOverlappingRuntime',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),

  // Unexpected errors from MM backend, should not happen if UI validations are done,
  // show a generic error message instead of the specific error message
  // Unknown error source string: Something went wrong, please try again.
  [ExperimentApiErrorType.MatchmakingInvalidScoringConfigurations]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.MatchmakingUnexpectedProductType]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.MatchmakingEmptyConfiguration]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.MatchmakingEmptyVariantMetadata]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.MatchmakingVariantWeightMustBePositive]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.MatchmakingVariantWeightsUnbalanced]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.MatchmakingPlaceConfigRequiresScoringIdOrDefault]: translationKey(
    'Label.Error.ExperimentOperation.Unknown',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.InvalidTargetingCriteria]: translationKey(
    'Label.Error.ExperimentOperation.InvalidTargetingCriteria',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.TargetingNotAllowed]: translationKey(
    'Label.Error.ExperimentOperation.TargetingNotAllowed',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  [ExperimentApiErrorType.ExperimentResultsNotFound]: translationKey(
    'Label.Error.ExperimentOperation.ExperimentResultsNotFound',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
};

export default ExperimentOperationErrorTranslationKey;
