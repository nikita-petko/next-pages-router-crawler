import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  Toggle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { isComboboxTypeaheadListboxTarget } from '@modules/charts-generic/components/ComboboxTypeahead';
import TriggerSheet from '@modules/charts-generic/components/TriggerSheet/TriggerSheet';
import type { TriggerSheetAction } from '@modules/charts-generic/components/TriggerSheet/TriggerSheet';
import RAQIV2ClientProvider from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useSessionBrowserFilterLabels from '../hooks/useSessionBrowserFilterLabels';
import {
  DEFAULT_SESSION_BROWSER_DRAWER_FILTERS,
  type SessionBrowserDrawerFilters,
  type SessionBrowserFilters,
} from '../types/SessionBrowserFilters';
import { compactDrawerFilters, toDrawerFormValues } from '../utils/sessionBrowserFilters';
import ClientSessionBrowserDynamicRaqiFilterField from './ClientSessionBrowserDynamicRaqiFilterField';
import ClientSessionBrowserExitReasonFilterFields from './ClientSessionBrowserExitReasonFilterFields';
import ClientSessionBrowserNumericRangeField from './ClientSessionBrowserNumericRangeField';
import ClientSessionBrowserPlaceFilterFields from './ClientSessionBrowserPlaceFilterFields';
import ClientSessionBrowserRaqiEnumFilterField from './ClientSessionBrowserRaqiEnumFilterField';

export type ClientSessionBrowserFilterDrawerProps = {
  readonly filters: SessionBrowserFilters;
  readonly universeId: number;
  readonly onApply: (drawerFilters: SessionBrowserDrawerFilters) => void;
};

const ClientSessionBrowserFilterDrawer: FC<ClientSessionBrowserFilterDrawerProps> = ({
  filters,
  universeId,
  onApply,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const {
    funnelEventsLabel,
    customEventsLabel,
    hasBugReportLabel,
    deviceRamLabel,
    durationLabel,
    minFpsLabel,
    usedMemoryLabel,
    exitReasonLabel,
  } = useSessionBrowserFilterLabels();
  const filterByLabel = translate(
    translationKey('Action.FilterBy', TranslationNamespace.Analytics),
  );
  const applyLabel = translate(translationKey('Action.Apply', TranslationNamespace.Controls));
  const cancelLabel = translate(translationKey('Action.Cancel', TranslationNamespace.Controls));
  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const resetLabel = translate(translationKey('Action.Reset', TranslationNamespace.Controls));
  const metricLabel = translate(translationKey('Label.Metric', TranslationNamespace.Analytics));
  const deviceLabel = translate(translationKey('Label.Device', TranslationNamespace.Analytics));
  const sessionActivityLabel = tPendingTranslation(
    'Session activity',
    'Filter group for duration, FPS, memory usage, and exit reason.',
    translationKey('Label.SessionActivity', TranslationNamespace.ServerManagement),
  );
  const funnelEventsSearchPlaceholder = tPendingTranslation(
    'Search funnel events',
    'Placeholder for the searchable funnel event filter in the filter drawer.',
    translationKey('Placeholder.SearchFunnelEvents', TranslationNamespace.ServerManagement),
  );
  const customEventsSearchPlaceholder = tPendingTranslation(
    'Search custom events',
    'Placeholder for the searchable custom event filter in the filter drawer.',
    translationKey('Placeholder.SearchCustomEvents', TranslationNamespace.ServerManagement),
  );
  const funnelEventsLoadErrorLabel = tPendingTranslation(
    'Could not load funnel events, please try again later.',
    'Error shown when funnel event options fail to load in the filter drawer.',
    translationKey('Description.SessionFunnelEventsLoadFailed', TranslationNamespace.Analytics),
  );
  const customEventsLoadErrorLabel = tPendingTranslation(
    'Could not load custom events, please try again later.',
    'Error shown when custom event options fail to load in the filter drawer.',
    translationKey('Description.SessionCustomEventsLoadFailed', TranslationNamespace.Analytics),
  );
  const noValuesAvailableLabel = translate(
    translationKey('Label.NoValuesAvailable', TranslationNamespace.Analytics),
  );
  const minPlaceholder = translate(
    translationKey('Label.Dimension.AggregationType.Min', TranslationNamespace.Analytics),
  );
  const maxPlaceholder = translate(
    translationKey('Label.Dimension.AggregationType.Max', TranslationNamespace.Analytics),
  );
  const minutesSuffix = translate(
    translationKey('Label.MinsSuffix', TranslationNamespace.Analytics),
  );
  const megabytesSuffix = translate(
    translationKey('Label.MegabytesSuffix', TranslationNamespace.Analytics),
  );

  const rangeFieldPlaceholders = {
    minPlaceholder,
    maxPlaceholder,
  };

  const form = useForm<SessionBrowserDrawerFilters>({
    defaultValues: DEFAULT_SESSION_BROWSER_DRAWER_FILTERS,
  });
  const { reset, handleSubmit, control } = form;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        reset(toDrawerFormValues(filters));
      }
    },
    [filters, reset],
  );

  const handleApply = useCallback(() => {
    void handleSubmit((drawerFilters) => {
      onApply(compactDrawerFilters(drawerFilters));
    })();
  }, [handleSubmit, onApply]);

  const handleReset = useCallback(() => {
    reset(DEFAULT_SESSION_BROWSER_DRAWER_FILTERS);
  }, [reset]);

  const actions = useMemo<readonly TriggerSheetAction[]>(
    () => [
      { label: applyLabel, variant: 'Emphasis', onClick: handleApply },
      { label: cancelLabel, variant: 'Standard' },
      { label: resetLabel, variant: 'Utility', onClick: handleReset, closesSheet: false },
    ],
    [applyLabel, cancelLabel, handleApply, handleReset, resetLabel],
  );

  return (
    <RAQIV2ClientProvider>
      <FormProvider {...form}>
        <TriggerSheet
          buttonLabel={filterByLabel}
          closeLabel={closeLabel}
          title={filterByLabel}
          actions={actions}
          buttonIcon='icon-filled-three-bars-horizontal-narrowing'
          shouldPreventOutsideDismiss={isComboboxTypeaheadListboxTarget}
          onOpenChange={handleOpenChange}>
          <Accordion size='Medium' hasDivider>
            <AccordionItem defaultOpen>
              <AccordionItemTrigger>{metricLabel}</AccordionItemTrigger>
              <AccordionItemContent className='flex flex-col gap-large width-full'>
                <ClientSessionBrowserPlaceFilterFields universeId={universeId} />
                <ClientSessionBrowserDynamicRaqiFilterField
                  name='funnelTags'
                  universeId={universeId}
                  label={funnelEventsLabel}
                  searchPlaceholder={funnelEventsSearchPlaceholder}
                  noValuesAvailableLabel={noValuesAvailableLabel}
                  loadErrorLabel={funnelEventsLoadErrorLabel}
                />
                <ClientSessionBrowserDynamicRaqiFilterField
                  name='customTags'
                  universeId={universeId}
                  label={customEventsLabel}
                  searchPlaceholder={customEventsSearchPlaceholder}
                  noValuesAvailableLabel={noValuesAvailableLabel}
                  loadErrorLabel={customEventsLoadErrorLabel}
                />
                <Controller
                  name='hasBugReport'
                  control={control}
                  render={({ field }) => (
                    <Toggle
                      size='Medium'
                      placement='Start'
                      label={hasBugReportLabel}
                      isChecked={field.value === true}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </AccordionItemContent>
            </AccordionItem>
            <AccordionItem>
              <AccordionItemTrigger>{deviceLabel}</AccordionItemTrigger>
              <AccordionItemContent className='flex flex-col gap-large width-full'>
                <ClientSessionBrowserRaqiEnumFilterField name='platforms' />
                <ClientSessionBrowserRaqiEnumFilterField name='operatingSystems' />
                <ClientSessionBrowserNumericRangeField
                  name='deviceRamMegabytes'
                  label={deviceRamLabel}
                  unitSuffix={megabytesSuffix}
                  {...rangeFieldPlaceholders}
                />
              </AccordionItemContent>
            </AccordionItem>
            <AccordionItem>
              <AccordionItemTrigger>{sessionActivityLabel}</AccordionItemTrigger>
              <AccordionItemContent className='flex flex-col gap-large width-full'>
                <ClientSessionBrowserNumericRangeField
                  name='durationMinutes'
                  label={durationLabel}
                  unitSuffix={minutesSuffix}
                  {...rangeFieldPlaceholders}
                />
                <ClientSessionBrowserNumericRangeField
                  name='minFps'
                  label={minFpsLabel}
                  {...rangeFieldPlaceholders}
                />
                <ClientSessionBrowserNumericRangeField
                  name='usedMemoryMegabytes'
                  label={usedMemoryLabel}
                  unitSuffix={megabytesSuffix}
                  {...rangeFieldPlaceholders}
                />
                <ClientSessionBrowserExitReasonFilterFields label={exitReasonLabel} />
              </AccordionItemContent>
            </AccordionItem>
          </Accordion>
        </TriggerSheet>
      </FormProvider>
    </RAQIV2ClientProvider>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionBrowserFilterDrawer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.ServerManagement,
]);
