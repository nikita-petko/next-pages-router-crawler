import type { FC } from 'react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ExperienceAlertFormValues } from '../../constants/types';
import { buildExploreModeUrlFromAlertForm } from '../../utils/alertExploreModeUrls';

type ViewMetricInExploreModeButtonProps = {
  readonly universeId: number;
};

/**
 * Opens Explore Mode in a new tab, pre-filled with the alert form's current
 * metric, granularity, breakdown, and filters. Disabled until a metric is
 * selected.
 */
const ViewMetricInExploreModeButton: FC<ViewMetricInExploreModeButtonProps> = ({ universeId }) => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();

  const metric = useWatch({ control, name: 'metric' });
  const interval = useWatch({ control, name: 'interval' });
  const filters = useWatch({ control, name: 'filters' });
  const breakdownDimension = useWatch({ control, name: 'breakdownDimension' });
  const breakdownCategories = useWatch({ control, name: 'breakdownCategories' });

  const href = useMemo(
    () =>
      buildExploreModeUrlFromAlertForm({
        values: { metric, interval, filters, breakdownDimension, breakdownCategories },
        universeId,
      }) ?? '/',
    [metric, interval, filters, breakdownDimension, breakdownCategories, universeId],
  );

  return (
    <Button
      className='margin-top-[28px]'
      as='a'
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      variant='Standard'
      size='Medium'
      icon='icon-regular-arrow-up-right-from-square'
      isDisabled={href === '/'}
      data-testid='view-metric-in-explore-mode-button'>
      {translate(translationKey('Action.SeeMetric', TranslationNamespace.Analytics))}
    </Button>
  );
};

export default ViewMetricInExploreModeButton;
