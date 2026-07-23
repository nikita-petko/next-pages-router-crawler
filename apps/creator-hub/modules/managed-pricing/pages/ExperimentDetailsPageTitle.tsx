/* istanbul ignore file */
import { memo } from 'react';
import { useLocalization, useTranslation, withTranslation, Locale } from '@rbx/intl';
import { Badge } from '@rbx/foundation-ui';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PageTitle from '@modules/monetization-shared/title';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useExperimentId } from '@modules/monetization-shared/route/useExperimentId';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useGetExperimentSummary } from '../queries/useGetExperimentSummary';
import { openRescheduleEventDialog } from '../dialogs/RescheduleEventDialog';
import type { ManagedPricingEvent } from '../pricing-activity/types';

// TODO: flesh out more statuses and add translations
const STATUS_LABEL_KEYS = {
  upcoming: 'Label.Upcoming',
  completed: 'Label.Completed',
} satisfies Record<ManagedPricingEvent['status'], string>;

function formatDate(date: Date, locale: Locale | null): string {
  return date.toLocaleDateString(locale ?? undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

function ExperimentDetailsPageTitle() {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { universeId } = useUniverseId();
  const { experimentId } = useExperimentId();

  const { data: permissions } = useUniversePermissions(universeId);
  const { data: experiment } = useGetExperimentSummary({ universeId, experimentId });

  const hasPermission = permissions?.monetizeExperience || permissions?.viewAnalytics;
  if (!hasPermission || !experiment) {
    // Note: this is the title component, which will not be rendered under certain conditions
    return null;
  }

  const dateRangeLabel = experiment.endDate
    ? `${formatDate(experiment.startDate, locale)} - ${formatDate(experiment.endDate, locale)}`
    : formatDate(experiment.startDate, locale);

  const shouldShowReschedule = experiment.status === 'upcoming'; // TODO: add in-progress

  return (
    <PageTitle
      title={
        <div className='flex wrap items-center gap-medium medium:gap-xlarge'>
          <h1 className='text-heading-large text-no-wrap margin-none'>
            {translate('Label.PriceTest')}
          </h1>
          <span className='flex gap-medium medium:gap-xlarge'>
            <Badge variant='Contrast' label={translate(STATUS_LABEL_KEYS[experiment.status])} />
            <Badge variant='Neutral' label={dateRangeLabel} />
          </span>
        </div>
      }
      actionProps={
        shouldShowReschedule
          ? {
              variant: 'Standard',
              onClick: () => openRescheduleEventDialog(universeId!),
              children: translate('Action.Reschedule'),
              className: 'width-full medium:width-fit', // Custom responsive layout for this title action
            }
          : undefined
      }
      className={shouldShowReschedule ? 'wrap' : undefined} // TODO: revisiting this once we iterate on creator hub layout
    />
  );
}

export default withTranslation(memo(ExperimentDetailsPageTitle), [
  TranslationNamespace.ManagedPricing,
]);
