import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TriggerSheet from '@modules/charts-generic/components/TriggerSheet/TriggerSheet';
import type { TriggerSheetAction } from '@modules/charts-generic/components/TriggerSheet/TriggerSheet';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  DEFAULT_SESSION_BROWSER_DRAWER_FILTERS,
  type SessionBrowserDrawerFilters,
  type SessionBrowserFilters,
} from '../types/SessionBrowserFilters';
import { compactDrawerFilters, toDrawerFormValues } from '../utils/sessionBrowserFilters';
import ClientSessionBrowserPlaceFilterFields from './ClientSessionBrowserPlaceFilterFields';

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
  const { translate } = useTranslationWrapper(useTranslation());
  const filterByLabel = translate(
    translationKey('Action.FilterBy', TranslationNamespace.Analytics),
  );
  const applyLabel = translate(translationKey('Action.Apply', TranslationNamespace.Controls));
  const cancelLabel = translate(translationKey('Action.Cancel', TranslationNamespace.Controls));
  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const resetLabel = translate(translationKey('Action.Reset', TranslationNamespace.Controls));
  const metricLabel = translate(translationKey('Label.Metric', TranslationNamespace.Analytics));

  const form = useForm<SessionBrowserDrawerFilters>({
    defaultValues: DEFAULT_SESSION_BROWSER_DRAWER_FILTERS,
  });
  const { reset, handleSubmit } = form;

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
            <AccordionItemContent>
              <ClientSessionBrowserPlaceFilterFields universeId={universeId} />
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
]);
