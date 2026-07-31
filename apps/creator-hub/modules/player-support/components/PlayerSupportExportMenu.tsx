import { useCallback, useMemo, useState, type FunctionComponent } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  MenuLabel,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { TAlertProps } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';
import useSnackbarAlert from '@modules/miscellaneous/hooks/useSnackbarAlert';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const PlayerSupportExportScope = {
  Selected: 'selected',
  CurrentPage: 'currentPage',
  All: 'all',
} as const;
export type PlayerSupportExportScope =
  (typeof PlayerSupportExportScope)[keyof typeof PlayerSupportExportScope];

export interface PlayerSupportExportResult {
  truncated: boolean;
}

const EXPORT_TIMEOUT_STATUS_CODES = new Set([408, 504]);
const SNACKBAR_ANCHOR = { vertical: 'bottom', horizontal: 'center' } as const;
// A popover menu has no width of its own, so this mirrors the filter dropdowns.
const MENU_CLASS_NAME = 'min-width-[263px] medium:min-width-[208px]';
// `!` beats the body scale `MenuLabel` sets.
const MENU_LABEL_CLASS_NAME = '!text-caption-medium height-1000';

interface PlayerSupportExportMenuProps {
  selectedCount: number;
  currentPageCount: number;
  /** Requests matching the active filters across every page, not just the current one. */
  allCount: number;
  hasActiveFilters: boolean;
  isDisabled?: boolean;
  onExport: (scope: PlayerSupportExportScope) => Promise<PlayerSupportExportResult>;
}

const PlayerSupportExportMenu: FunctionComponent<PlayerSupportExportMenuProps> = ({
  selectedCount,
  currentPageCount,
  allCount,
  hasActiveFilters,
  isDisabled = false,
  onExport,
}) => {
  // Pending helpers use these English fallbacks until the keys are registered,
  // then automatically resolve the registered translations without code changes.
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const showSnackbarMessage = useSnackbarAlert();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const exportLabel = tPendingTranslation(
    'Export rows',
    'Heading for the player support export menu.',
    translationKey('Heading.PlayerSupport.Export', TranslationNamespace.PlayerFeedback),
  );
  const exportButtonLabel = tPendingTranslation(
    'Export support requests',
    'Accessible label for the player support export button.',
    translationKey('Action.PlayerSupport.Export', TranslationNamespace.PlayerFeedback),
  );
  const exportTooltipLabel = tPendingTranslation(
    'Export your data to a .CSV file',
    'Tooltip shown on hover over the player support export button.',
    translationKey('Description.PlayerSupport.ExportTooltip', TranslationNamespace.PlayerFeedback),
  );
  const currentPageLabel = tPendingTranslation(
    'Current page ({count})',
    'Player support export option for the support requests on the current page; {count} is the number of requests.',
    translationKey('Label.PlayerSupport.Export.CurrentPage', TranslationNamespace.PlayerFeedback),
    { count: numberFormatter.format(currentPageCount) },
  );
  const selectedLabel = tPendingTranslation(
    'Selected ({count})',
    'Player support export option for the selected support requests; {count} is the number of selected requests.',
    translationKey('Label.PlayerSupport.Export.Selected', TranslationNamespace.PlayerFeedback),
    { count: numberFormatter.format(selectedCount) },
  );
  const allScopeCount = numberFormatter.format(allCount);
  const allLabel = hasActiveFilters
    ? tPendingTranslation(
        'All filtered ({count})',
        'Player support export option for every support request matching the active filters; {count} is the number of matching requests.',
        translationKey(
          'Label.PlayerSupport.Export.AllFiltered',
          TranslationNamespace.PlayerFeedback,
        ),
        { count: allScopeCount },
      )
    : tPendingTranslation(
        'All ({count})',
        'Player support export option for every support request in the current tab; {count} is the total number of requests.',
        translationKey('Label.PlayerSupport.Export.All', TranslationNamespace.PlayerFeedback),
        { count: allScopeCount },
      );
  const truncatedExportLabel = tPendingTranslation(
    'Download limit reached. Try filtering by date or category.',
    'Warning shown after a player support export is truncated at the maximum download row count.',
    translationKey('Message.PlayerSupport.ExportLimitReached', TranslationNamespace.PlayerFeedback),
  );
  const exportTimeoutLabel = tPendingTranslation(
    'Download timed out. Try filtering by date or category to reduce file size.',
    'Warning shown when a player support export request times out.',
    translationKey('Message.PlayerSupport.ExportTimeout', TranslationNamespace.PlayerFeedback),
  );
  const exportErrorLabel = tPendingTranslation(
    "Couldn't download support requests. Try again.",
    'Error shown when a player support export fails.',
    translationKey('Message.PlayerSupport.ExportError', TranslationNamespace.PlayerFeedback),
  );

  const notify = useCallback(
    (severity: TAlertProps['severity'], message: string) => {
      showSnackbarMessage(severity, message, 'standard', SNACKBAR_ANCHOR);
    },
    [showSnackbarMessage],
  );

  const handleExport = useCallback(
    async (scope: PlayerSupportExportScope) => {
      setIsOpen(false);
      try {
        const { truncated } = await onExport(scope);
        if (truncated) {
          notify('warning', truncatedExportLabel);
        }
      } catch (error) {
        const status = getResponseFromError(error)?.status;
        if (status !== undefined && EXPORT_TIMEOUT_STATUS_CODES.has(status)) {
          notify('warning', exportTimeoutLabel);
        } else {
          notify('error', exportErrorLabel);
        }
      }
    },
    [exportErrorLabel, exportTimeoutLabel, notify, onExport, truncatedExportLabel],
  );

  const scopeOptions = useMemo(
    () =>
      [
        // Nothing selected leaves this scope with no meaning, so it appears with a
        // selection rather than sitting greyed out in the menu.
        ...(selectedCount > 0
          ? [
              {
                scope: PlayerSupportExportScope.Selected,
                title: selectedLabel,
                disabled: false,
              },
            ]
          : []),
        {
          scope: PlayerSupportExportScope.CurrentPage,
          title: currentPageLabel,
          disabled: currentPageCount === 0,
        },
        { scope: PlayerSupportExportScope.All, title: allLabel, disabled: false },
      ].map((option) => ({
        ...option,
        onSelect: () => {
          void handleExport(option.scope);
        },
      })),
    [allLabel, currentPageCount, currentPageLabel, handleExport, selectedCount, selectedLabel],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip position='top-center' delayDurationMs={0} title={exportTooltipLabel}>
        <TooltipTrigger asChild>
          {/* Radix drops the tooltip's hover handlers when two asChild triggers
              collapse onto the same element, so the span keeps them separate. */}
          <span>
            <PopoverTrigger asChild disabled={isDisabled}>
              <IconButton
                as='button'
                ariaLabel={exportButtonLabel}
                className='[&>.icon]:!size-300 [&>.icon]:!bg-system-neutral'
                icon='icon-filled-arrow-down-to-line'
                isDisabled={isDisabled}
                size='Small'
                variant='Standard'
              />
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
      </Tooltip>
      <PopoverContent side='bottom' align='end' ariaLabel={exportLabel}>
        <Menu size='Medium' className={MENU_CLASS_NAME}>
          <MenuSection>
            {[
              <MenuLabel key='heading' title={exportLabel} className={MENU_LABEL_CLASS_NAME} />,
              ...scopeOptions.map(({ scope, title, disabled, onSelect }) => (
                <MenuItem
                  key={scope}
                  disabled={disabled}
                  onSelect={onSelect}
                  title={title}
                  value={scope}
                />
              )),
            ]}
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

export default PlayerSupportExportMenu;
