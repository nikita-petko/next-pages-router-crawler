import { useCallback, type FC } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Icon } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { FoundationLikeMultiSelect } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu as MultiSelectMenu,
  MenuItem as MultiSelectMenuItem,
  MenuSeparator as MultiSelectMenuSeparator,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import type { ExperienceAlertFormValues } from '../../constants/types';
import useUniverseWebhooksQuery from '../../hooks/useUniverseWebhooksQuery';

const NS = TranslationNamespace.ExperienceAlerts;

/**
 * Sentinel value used as the `value` for the empty-state "create a new webhook"
 * menu item. The Foundation multi-select always appends the clicked item's
 * value to the selection list; we intercept this sentinel in `onValueChange`
 * to open the webhooks settings page in a new tab instead of mutating the
 * form state. The prefix makes it extremely unlikely to collide with a real
 * `webhookConfigurationId`, which is a server-generated string id.
 */
const CREATE_NEW_WEBHOOK_SENTINEL = '__experience-alert-webhook-create-new__';

export type ExperienceAlertWebhookFieldProps = {
  universeId: number;
};

const ExperienceAlertWebhookField: FC<ExperienceAlertWebhookFieldProps> = ({ universeId }) => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();

  const { data: webhooks, isPending, isError, refetch } = useUniverseWebhooksQuery(universeId);

  // Pulled to the component level (vs. inline `Controller`) so the value/open
  // change handlers below can be stabilized with `useCallback`. The child
  // `FoundationLikeMultiSelect` uses these props as `useCallback`/`useEffect`
  // dependencies (the open handler cascades into a click-outside listener),
  // so unstable references would cause it to reattach listeners every render.
  const {
    field: { value, onChange, onBlur },
  } = useController({
    name: 'webhookConfigurationIds',
    control,
  });

  const isLoading = isPending && !isError;
  const hasNoWebhooks = !isLoading && !isError && (webhooks?.length ?? 0) === 0;
  // Empty state is still interactive — it opens the menu and renders a single
  // "create a webhook" CTA item. Only fully disable while loading or errored.
  const isDropdownDisabled = isLoading || isError;

  // Render each selected webhook by its display name so the trigger reads
  // sensibly even when the form has multiple webhooks attached. Falls back to
  // the raw id if a previously-selected receiver was deleted between the alert
  // being saved and the user re-opening it; we keep the id so the round-trip
  // does not silently drop the attachment.
  const formatValue = useCallback(
    (selectedValues: string[]): string => {
      if (selectedValues.length === 0) {
        return '';
      }
      return selectedValues
        .map((id) => {
          const webhook = webhooks?.find((w) => w.id === id);
          if (!webhook) {
            return id;
          }
          return webhook.webhookConfigurationParameters.name;
        })
        .join(', ');
    },
    [webhooks],
  );

  const placeholder = isLoading
    ? translate(translationKey('Placeholder.LoadingWebhookReceivers', NS))
    : translate(translationKey('Placeholder.SelectWebhookReceivers', NS));

  const createWebhookCtaTitle = translate(translationKey('Action.CreateNewWebhook', NS));

  const handleCreateNewWebhookClick = useCallback(() => {
    // Open the settings page in a new tab so the user does not lose the
    // partially-filled alert form. `noopener,noreferrer` prevents the new tab
    // from gaining a reference back to this window via `window.opener`.
    if (typeof window !== 'undefined') {
      window.open(
        creatorHub.dashboard.getExperienceWebhooksUrl(universeId),
        '_blank',
        'noopener,noreferrer',
      );
    }
  }, [universeId]);

  const handleValueChange = useCallback(
    (next: string[]) => {
      // The Foundation multi-select always appends a clicked item's value
      // to the selection list. Treat the create-new sentinel as a CTA:
      // open the settings page in a new tab and short-circuit before any
      // sentinel value can leak into the form state.
      if (next.includes(CREATE_NEW_WEBHOOK_SENTINEL)) {
        handleCreateNewWebhookClick();
        return;
      }
      onChange(next);
    },
    [handleCreateNewWebhookClick, onChange],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        // Silently refresh in case the user added a webhook in another
        // tab between opening the form and opening the dropdown. We
        // intentionally do not await — the menu keeps showing stale
        // data while React Query swaps in the fresh list.
        void refetch();
      } else {
        onBlur();
      }
    },
    [refetch, onBlur],
  );

  return (
    <FoundationLikeMultiSelect
      label={translate(translationKey('Label.WebhookReceivers', NS))}
      size='Medium'
      placeholder={placeholder}
      value={value}
      onValueChange={handleValueChange}
      isDisabled={isDropdownDisabled}
      formatValue={formatValue}
      onOpenChange={handleOpenChange}>
      <MultiSelectMenu>
        {webhooks?.map((webhook) => (
          <MultiSelectMenuItem
            key={webhook.id}
            value={webhook.id}
            title={webhook.webhookConfigurationParameters.name}
          />
        ))}
        {!hasNoWebhooks && <MultiSelectMenuSeparator />}
        <MultiSelectMenuItem
          value={CREATE_NEW_WEBHOOK_SENTINEL}
          title={createWebhookCtaTitle}
          leading={<Icon name='icon-filled-plus-small' />}
          trailing={<Icon name='icon-filled-arrow-up-right-from-square' />}
        />
      </MultiSelectMenu>
    </FoundationLikeMultiSelect>
  );
};

export default ExperienceAlertWebhookField;
