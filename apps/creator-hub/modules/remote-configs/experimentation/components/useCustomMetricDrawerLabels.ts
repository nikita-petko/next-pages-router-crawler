import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CustomMetricCategory } from '../types/CustomMetric';
import { CustomMetricCalculation } from '../types/CustomMetricCalculation';
import type { PrimarySelectionField } from '../utils/customMetricDraft';

const NS = TranslationNamespace.UniverseConfigAndExperimentation;
const CONTROLS_NS = TranslationNamespace.Controls;

export type CustomMetricDrawerLabels = {
  addTitle: string;
  editTitle: string;
  definition: string;
  sourceLabel: string;
  sourcePlaceholder: string;
  categoryLabel: Record<CustomMetricCategory, string>;
  // Keyed by primary-selection field (currency / funnel / funnelStep /
  // customEvent) so each selection — including funnel step — has its own copy.
  primaryLabel: Record<PrimarySelectionField, string>;
  primaryPlaceholder: Record<PrimarySelectionField, string>;
  calculationLabel: string;
  calculationPlaceholder: string;
  calculationOption: Record<CustomMetricCalculation, string>;
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  save: string;
  cancel: string;
  resetAll: string;
};

/**
 * All user-facing copy for the custom-metric drawer body, resolved via
 * `tPendingTranslation` (copy isn't finalized, so the keys are intentionally
 * unregistered). Extracted from {@link CustomMetricDrawer} so the sizeable
 * per-category / per-calculation label maps don't clutter the render. Each
 * calculation and source keeps its own key so they can be localized
 * independently.
 */
const useCustomMetricDrawerLabels = (): CustomMetricDrawerLabels => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  return {
    addTitle: tPendingTranslation(
      'Add custom metric',
      'Title of the drawer when adding a new custom metric.',
      translationKey('Title.ExperimentCreation.AddCustomMetricDrawer', NS),
    ),
    editTitle: tPendingTranslation(
      'Edit custom metric',
      'Title of the drawer when editing an existing custom metric.',
      translationKey('Title.ExperimentCreation.EditCustomMetric', NS),
    ),
    definition: tPendingTranslation(
      'Definition',
      'Heading for the definition section of the custom metric drawer.',
      translationKey('Label.ExperimentCreation.CustomMetricDefinition', NS),
    ),
    sourceLabel: tPendingTranslation(
      'Source',
      'Label for the source (category) dropdown in the custom metric drawer.',
      translationKey('Label.ExperimentCreation.CustomMetricSource', NS),
    ),
    sourcePlaceholder: tPendingTranslation(
      'Select source',
      'Placeholder for the source dropdown in the custom metric drawer.',
      translationKey('Placeholder.ExperimentCreation.CustomMetricSource', NS),
    ),
    categoryLabel: {
      [CustomMetricCategory.Economy]: tPendingTranslation(
        'Economy',
        'Economy source option in the custom metric drawer.',
        translationKey('Label.CustomMetricSource.Economy', NS),
      ),
      [CustomMetricCategory.Funnel]: tPendingTranslation(
        'Funnel',
        'Funnel source option in the custom metric drawer.',
        translationKey('Label.CustomMetricSource.Funnel', NS),
      ),
      [CustomMetricCategory.Custom]: tPendingTranslation(
        'Custom',
        'Custom source option in the custom metric drawer.',
        translationKey('Label.CustomMetricSource.Custom', NS),
      ),
    },
    primaryLabel: {
      currency: tPendingTranslation(
        'Currency',
        'Label for the currency selection in the economy custom metric drawer.',
        translationKey('Label.ExperimentCreation.CustomMetricCurrency', NS),
      ),
      funnel: tPendingTranslation(
        'Funnel',
        'Label for the funnel selection in the funnel custom metric drawer.',
        translationKey('Label.ExperimentCreation.CustomMetricFunnel', NS),
      ),
      funnelStep: tPendingTranslation(
        'Funnel step',
        'Label for the funnel step selection in the funnel custom metric drawer.',
        translationKey('Label.ExperimentCreation.CustomMetricFunnelStep', NS),
      ),
      customEvent: tPendingTranslation(
        'Event type',
        'Label for the event type selection in the custom event metric drawer.',
        translationKey('Label.ExperimentCreation.CustomMetricEventType', NS),
      ),
    },
    primaryPlaceholder: {
      currency: tPendingTranslation(
        'Select currency',
        'Placeholder for the currency selection in the economy custom metric drawer.',
        translationKey('Placeholder.ExperimentCreation.CustomMetricCurrency', NS),
      ),
      funnel: tPendingTranslation(
        'Select funnel',
        'Placeholder for the funnel selection in the funnel custom metric drawer.',
        translationKey('Placeholder.ExperimentCreation.CustomMetricFunnel', NS),
      ),
      funnelStep: tPendingTranslation(
        'Select step',
        'Placeholder for the funnel step selection in the funnel custom metric drawer.',
        translationKey('Placeholder.ExperimentCreation.CustomMetricFunnelStep', NS),
      ),
      customEvent: tPendingTranslation(
        'Select event type',
        'Placeholder for the event type selection in the custom event metric drawer.',
        translationKey('Placeholder.ExperimentCreation.CustomMetricEventType', NS),
      ),
    },
    calculationLabel: tPendingTranslation(
      'Calculation',
      'Label for the calculation dropdown in the custom metric drawer.',
      translationKey('Label.ExperimentCreation.CustomMetricCalculation', NS),
    ),
    calculationPlaceholder: tPendingTranslation(
      'Select calculation',
      'Placeholder for the calculation dropdown in the custom metric drawer.',
      translationKey('Placeholder.ExperimentCreation.CustomMetricCalculation', NS),
    ),
    calculationOption: {
      [CustomMetricCalculation.AverageCustomValue]: tPendingTranslation(
        'Average Custom Value',
        'Custom-event calculation: average custom value across users who logged the event.',
        translationKey('Label.CustomMetricCalculation.AverageCustomValue', NS),
      ),
      [CustomMetricCalculation.AverageCustomValueAllUsers]: tPendingTranslation(
        'Average Custom Value over all Users',
        'Custom-event calculation: average custom value across all enrolled users.',
        translationKey('Label.CustomMetricCalculation.AverageCustomValueAllUsers', NS),
      ),
      [CustomMetricCalculation.CustomPenetration]: tPendingTranslation(
        'Custom Penetration %',
        'Custom-event calculation: share of enrolled users who logged the event at least once.',
        translationKey('Label.CustomMetricCalculation.CustomPenetration', NS),
      ),
      [CustomMetricCalculation.AverageNetCurrencyDelta]: tPendingTranslation(
        'Average Net Currency Delta',
        'Economy calculation: average net currency change (sources minus sinks) per user.',
        translationKey('Label.CustomMetricCalculation.AverageNetCurrencyDelta', NS),
      ),
      [CustomMetricCalculation.AverageCurrencySourceDelta]: tPendingTranslation(
        'Average Currency Source Delta',
        'Economy calculation: average currency gained (sources) per user.',
        translationKey('Label.CustomMetricCalculation.AverageCurrencySourceDelta', NS),
      ),
      [CustomMetricCalculation.AverageCurrencySinkDelta]: tPendingTranslation(
        'Average Currency Sink Delta',
        'Economy calculation: average currency spent (sinks) per user.',
        translationKey('Label.CustomMetricCalculation.AverageCurrencySinkDelta', NS),
      ),
      [CustomMetricCalculation.PerUserFunnelConversion]: tPendingTranslation(
        'Per-User Funnel Conversion %',
        'Funnel calculation: per-user funnel completion rate.',
        translationKey('Label.CustomMetricCalculation.PerUserFunnelConversion', NS),
      ),
      [CustomMetricCalculation.PerInstanceFunnelConversion]: tPendingTranslation(
        'Per-Instance Funnel Conversion %',
        'Funnel calculation: per-instance (session) funnel completion rate.',
        translationKey('Label.CustomMetricCalculation.PerInstanceFunnelConversion', NS),
      ),
    },
    nameLabel: tPendingTranslation(
      'Metric name',
      'Label for the metric name field in the custom metric drawer.',
      translationKey('Label.ExperimentCreation.CustomMetricName', NS),
    ),
    namePlaceholder: tPendingTranslation(
      'Metric name',
      'Placeholder for the metric name field in the custom metric drawer.',
      translationKey('Placeholder.ExperimentCreation.CustomMetricName', NS),
    ),
    nameHint: tPendingTranslation(
      'Auto-generated based on your selections. You can edit or reset this anytime.',
      'Helper text under the metric name field in the custom metric drawer.',
      translationKey('Message.ExperimentCreation.CustomMetricNameHint', NS),
    ),
    save: translate(translationKey('Action.Save', CONTROLS_NS)),
    cancel: translate(translationKey('Action.Cancel', CONTROLS_NS)),
    resetAll: tPendingTranslation(
      'Reset all',
      'Button that resets all fields in the custom metric drawer.',
      translationKey('Action.ExperimentCreation.ResetCustomMetric', NS),
    ),
  };
};

export default useCustomMetricDrawerLabels;
