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
import FilterStringChoice, {
  BlankHandlingType,
} from '@modules/charts-generic/components/FilterStringChoice';
import TriggerSheet from '@modules/charts-generic/components/TriggerSheet/TriggerSheet';
import type { TriggerSheetAction } from '@modules/charts-generic/components/TriggerSheet/TriggerSheet';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useSessionBrowserFilterLabels from '../hooks/useSessionBrowserFilterLabels';
import {
  DEFAULT_SESSION_BROWSER_DRAWER_FILTERS,
  type SessionBrowserDrawerFilters,
  type SessionBrowserFilters,
} from '../types/SessionBrowserFilters';
import { compactDrawerFilters, toDrawerFormValues } from '../utils/sessionBrowserFilters';
import ClientSessionBrowserExitReasonFilterFields from './ClientSessionBrowserExitReasonFilterFields';
import ClientSessionBrowserNumericRangeField from './ClientSessionBrowserNumericRangeField';
import ClientSessionBrowserPlaceFilterFields from './ClientSessionBrowserPlaceFilterFields';
import ClientSessionBrowserRaqiEnumFilterField from './ClientSessionBrowserRaqiEnumFilterField';

const EMPTY_EVENT_OPTIONS: string[] = [];

const ignoreEventFilterChange = (): void => undefined;

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
  const funnelEventsLabel = tPendingTranslation(
    'Contains funnel events',
    'Filter for client sessions that include selected funnel events.',
    translationKey('Label.ContainsFunnelEvents', TranslationNamespace.ServerManagement),
  );
  const customEventsLabel = tPendingTranslation(
    'Contains custom events',
    'Filter for client sessions that include selected custom events.',
    translationKey('Label.ContainsCustomEvents', TranslationNamespace.ServerManagement),
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
    <FormProvider {...form}>
      <TriggerSheet
        buttonLabel={filterByLabel}
        closeLabel={closeLabel}
        title={filterByLabel}
        actions={actions}
        buttonIcon='icon-filled-three-bars-horizontal-narrowing'
        onOpenChange={handleOpenChange}>
        <Accordion size='Medium' hasDivider>
          <AccordionItem defaultOpen>
            <AccordionItemTrigger>{metricLabel}</AccordionItemTrigger>
            <AccordionItemContent className='flex flex-col gap-large width-full'>
              <ClientSessionBrowserPlaceFilterFields universeId={universeId} />
              <FilterStringChoice
                size='small'
                label={funnelEventsLabel}
                multiple
                selectedOptions={EMPTY_EVENT_OPTIONS}
                options={EMPTY_EVENT_OPTIONS}
                formatOption='literal'
                blankHandling={{
                  type: BlankHandlingType.Value,
                  value: noValuesAvailableLabel,
                }}
                onChange={ignoreEventFilterChange}
              />
              <FilterStringChoice
                size='small'
                label={customEventsLabel}
                multiple
                selectedOptions={EMPTY_EVENT_OPTIONS}
                options={EMPTY_EVENT_OPTIONS}
                formatOption='literal'
                blankHandling={{
                  type: BlankHandlingType.Value,
                  value: noValuesAvailableLabel,
                }}
                onChange={ignoreEventFilterChange}
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
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionBrowserFilterDrawer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.ServerManagement,
]);
