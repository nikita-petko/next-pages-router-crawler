import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

/** Centralized manage-page translations; description strings stay for translators. */
export function useManagePageTranslations() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return {
    pageTitle: tPendingTranslation(
      'Custom dashboards',
      'Page title for the custom-dashboards manage page.',
      translationKey('Heading.CustomDashboards.Manage', TranslationNamespace.Analytics),
    ),
    pageSubtitle: tPendingTranslation(
      'Build, manage, and edit customized dashboards.',
      'Sub-heading describing the custom-dashboards manage page. Followed in the UI by an inline "Learn more" link.',
      translationKey('Description.CustomDashboards.Manage', TranslationNamespace.Analytics),
    ),
    learnMoreLabel: tPendingTranslation(
      'Learn more',
      'Inline link in the manage-page subtitle that opens the documentation.',
      translationKey('Action.LearnMore', TranslationNamespace.Analytics),
    ),
    createButtonLabel: tPendingTranslation(
      'Create',
      'Button label for creating a custom dashboard.',
      translationKey('Action.CustomDashboards.Create', TranslationNamespace.Analytics),
    ),
    pageOverflowMenuLabel: tPendingTranslation(
      'Page actions',
      'Accessible label for the three-dot overflow menu in the manage-page header.',
      translationKey('Label.CustomDashboards.PageOverflowMenu', TranslationNamespace.Analytics),
    ),
    refreshAction: tPendingTranslation(
      'Refresh',
      'Action label for refreshing the custom dashboards list.',
      translationKey('Action.CustomDashboards.Refresh', TranslationNamespace.Analytics),
    ),

    searchPlaceholder: tPendingTranslation(
      'Search dashboards',
      'Placeholder for the search input that filters the dashboards table by name or description.',
      translationKey('Placeholder.CustomDashboards.Search', TranslationNamespace.Analytics),
    ),
    searchClearLabel: tPendingTranslation(
      'Clear search',
      'Accessible label and button label for clearing the dashboards search input.',
      translationKey('Action.CustomDashboards.ClearSearch', TranslationNamespace.Analytics),
    ),

    columnName: tPendingTranslation(
      'Name',
      'Column header for the dashboard name column.',
      translationKey('Column.CustomDashboards.Name', TranslationNamespace.Analytics),
    ),
    columnCreatedBy: tPendingTranslation(
      'Created by',
      'Column header for the user who created a custom dashboard.',
      translationKey('Column.CustomDashboards.CreatedBy', TranslationNamespace.Analytics),
    ),
    columnModifiedBy: tPendingTranslation(
      'Modified by',
      'Column header for the user who last modified a dashboard.',
      translationKey('Column.CustomDashboards.ModifiedBy', TranslationNamespace.Analytics),
    ),
    columnLastModified: tPendingTranslation(
      'Last modified',
      'Column header for the most-recent-edit timestamp of a dashboard.',
      translationKey('Column.CustomDashboards.LastModified', TranslationNamespace.Analytics),
    ),
    columnPinToSidebar: tPendingTranslation(
      'Pin to sidebar',
      'Column header whose toggle controls whether a dashboard is pinned in the analytics sidebar.',
      translationKey('Column.CustomDashboards.PinToSidebar', TranslationNamespace.Analytics),
    ),
    columnPinToSidebarTooltip: tPendingTranslation(
      'Pinned dashboards appear under Analytics in the side navigation.',
      'Tooltip text for the info icon next to the "Pin to sidebar" column header.',
      translationKey(
        'Description.CustomDashboards.PinToSidebarTooltip',
        TranslationNamespace.Analytics,
      ),
    ),

    pinToggleAriaLabel: (args: { name: string }) =>
      tPendingTranslation(
        'Pin {name} to sidebar',
        'Accessible name for the per-row pin toggle. Stays the same regardless of checked state — the state is communicated by aria-checked, per the W3C switch-role authoring practices. {name} is the dashboard name (interpolated verbatim) so screen-reader users can disambiguate one toggle from another in the dashboards table.',
        translationKey('Label.CustomDashboards.PinRowToSidebar', TranslationNamespace.Analytics),
        args,
      ),
    pinToggleLocalCopyDisabledTooltip: tPendingTranslation(
      "Local copies can't be pinned to the sidebar because they only exist in this browser.",
      'Tooltip shown on the disabled pin toggle for a hybrid-mode local-copy dashboard row, explaining why pinning is unavailable.',
      translationKey(
        'Description.CustomDashboards.PinLocalCopyDisabledTooltip',
        TranslationNamespace.Analytics,
      ),
    ),

    rowViewButton: tPendingTranslation(
      'View',
      'Hover-revealed per-row button that opens the dashboard.',
      translationKey('Action.CustomDashboards.ViewRow', TranslationNamespace.Analytics),
    ),
    rowOverflowMenuLabel: tPendingTranslation(
      'Dashboard actions',
      'Accessible label for the per-row three-dot overflow menu on the dashboards table.',
      translationKey('Label.CustomDashboards.RowOverflowMenu', TranslationNamespace.Analytics),
    ),
    rowMenuEdit: tPendingTranslation(
      'Edit',
      'Per-row action menu item that navigates to the dashboard editor.',
      translationKey('Action.Edit', TranslationNamespace.Analytics),
    ),
    rowMenuEditAsLocalCopy: tPendingTranslation(
      'Edit as local copy',
      'Per-row action menu item shown to internal users for a server dashboard; it creates a browser-local copy before opening the editor.',
      translationKey('Action.CustomDashboards.EditAsLocalCopy', TranslationNamespace.Analytics),
    ),
    rowMenuRename: tPendingTranslation(
      'Rename',
      'Per-row action menu item that opens a small dialog to rename a dashboard without entering the editor.',
      translationKey('Action.CustomDashboards.Rename', TranslationNamespace.Analytics),
    ),
    rowMenuDuplicate: tPendingTranslation(
      'Duplicate',
      'Per-row action menu item that creates a copy of the dashboard in place.',
      translationKey('Action.CustomDashboards.Duplicate', TranslationNamespace.Analytics),
    ),
    rowMenuDelete: tPendingTranslation(
      'Delete',
      'Action label for deleting a custom dashboard.',
      translationKey('Action.CustomDashboards.Delete', TranslationNamespace.Analytics),
    ),

    paginationRegionLabel: tPendingTranslation(
      'Pagination',
      'Accessible region label for the pagination strip below the dashboards table. Names the entire control (selector + range readout + nav buttons) so screen readers announce it as a single landmark.',
      translationKey('Label.Pagination.Region', TranslationNamespace.Analytics),
    ),
    unknownCreatorLabel: tPendingTranslation(
      'Unknown creator',
      'Fallback creator name shown when the custom dashboards API does not return a username.',
      translationKey('Label.CustomDashboards.UnknownCreator', TranslationNamespace.Analytics),
    ),
    paginationRowsPerPage: tPendingTranslation(
      'Rows per page',
      'Label for the pagination rows-per-page selector in the dashboards table.',
      translationKey('Label.Pagination.RowsPerPage', TranslationNamespace.Analytics),
    ),
    paginationRangeReadout: (args: { range: string; total: string }) =>
      tPendingTranslation(
        'Rows {range} of {total}',
        'Live readout describing which rows are currently visible in the dashboards table. {range} is the locale-formatted "start–end" pair (e.g. "1–10", "١–١٠") and {total} is the locale-formatted total count.',
        translationKey('Label.Pagination.RangeReadout', TranslationNamespace.Analytics),
        args,
      ),
    paginationRangeReadoutWithoutTotal: (args: { range: string }) =>
      tPendingTranslation(
        'Rows {range}',
        'Live readout describing which rows are visible when the cursor-paginated backend does not provide a total count. {range} is the locale-formatted start–end pair.',
        translationKey('Label.Pagination.RangeReadoutWithoutTotal', TranslationNamespace.Analytics),
        args,
      ),
    paginationRangeReadoutLoading: tPendingTranslation(
      'Rows —',
      'Placeholder shown in place of the rows range readout while the dashboards list is loading.',
      translationKey('Label.Pagination.RangeReadoutLoading', TranslationNamespace.Analytics),
    ),
    paginationFirstPageLabel: tPendingTranslation(
      'First page',
      'Accessible label for the pagination first-page button.',
      translationKey('Action.Pagination.FirstPage', TranslationNamespace.Analytics),
    ),
    paginationPrevPageLabel: tPendingTranslation(
      'Previous page',
      'Accessible label for the pagination previous-page button.',
      translationKey('Action.Pagination.PreviousPage', TranslationNamespace.Analytics),
    ),
    paginationNextPageLabel: tPendingTranslation(
      'Next page',
      'Accessible label for the pagination next-page button.',
      translationKey('Action.Pagination.NextPage', TranslationNamespace.Analytics),
    ),
    paginationLastPageLabel: tPendingTranslation(
      'Last page',
      'Accessible label for the pagination last-page button.',
      translationKey('Action.Pagination.LastPage', TranslationNamespace.Analytics),
    ),

    emptyStateHeadline: tPendingTranslation(
      'No custom dashboards yet',
      'Headline shown in the manage-page empty state when the experience has no dashboards.',
      translationKey('Heading.CustomDashboards.EmptyState', TranslationNamespace.Analytics),
    ),
    emptyStateDescription: tPendingTranslation(
      'Get started by building a dashboard from scratch or browsing existing templates.',
      'Description shown in the manage-page empty state below the headline.',
      translationKey('Description.CustomDashboards.EmptyState', TranslationNamespace.Analytics),
    ),
    emptyStateCtaLabel: tPendingTranslation(
      'Create',
      'Button label for creating a custom dashboard.',
      translationKey('Action.CustomDashboards.Create', TranslationNamespace.Analytics),
    ),

    noMatchesHeadline: tPendingTranslation(
      'No dashboards match your search.',
      'Headline shown in the manage-page table when the search input has no matching dashboards.',
      translationKey('Message.CustomDashboards.NoMatches', TranslationNamespace.Analytics),
    ),

    errorStateHeadline: tPendingTranslation(
      "We couldn't load your dashboards.",
      'Headline shown in the manage-page table area when the dashboards list query fails.',
      translationKey('Message.CustomDashboards.LoadError', TranslationNamespace.Analytics),
    ),
    errorStateRetryLabel: tPendingTranslation(
      'Try again',
      'Button label that re-runs the dashboards list query after a load failure.',
      translationKey('Action.CustomDashboards.RetryLoad', TranslationNamespace.Analytics),
    ),
    notAvailableHeadline: tPendingTranslation(
      "Custom dashboards aren't available right now.",
      'Headline shown in the manage-page table area when the selected custom-dashboards backend is unavailable.',
      translationKey('Message.CustomDashboards.NotAvailable', TranslationNamespace.Analytics),
    ),

    storageNoticeMigrationFailedSingular: tPendingTranslation(
      "1 dashboard couldn't be loaded with this version of Creator Hub. It's still saved and may load again after an update.",
      "Storage-failure notice shown on the manage page when exactly one record failed to migrate. Singular variant of the same cause's plural copy.",
      translationKey(
        'Message.CustomDashboards.MigrationFailed.One',
        TranslationNamespace.Analytics,
      ),
    ),
    storageNoticeMigrationFailedPlural: (args: { count: string }) =>
      tPendingTranslation(
        "{count} dashboards couldn't be loaded with this version of Creator Hub. They're still saved and may load again after an update.",
        'Storage-failure notice shown on the manage page when more than one record failed to migrate. Uses an ICU plural; {count} is the integer count.',
        translationKey(
          'Message.CustomDashboards.MigrationFailed.Other',
          TranslationNamespace.Analytics,
        ),
        args,
      ),
    storageNoticeUnavailable: tPendingTranslation(
      "Custom dashboards can't be saved right now. Try again later.",
      'Notice shown on the manage page when the selected custom-dashboards backend cannot be used.',
      translationKey('Message.CustomDashboards.StorageUnavailable', TranslationNamespace.Analytics),
    ),
    storageNoticeDismissLabel: tPendingTranslation(
      'Dismiss notification',
      'Accessible label for the close button on a storage-failure notice in the manage-page toast slot.',
      translationKey(
        'Action.CustomDashboards.DismissStorageNotice',
        TranslationNamespace.Analytics,
      ),
    ),
    storageNoticeWriteFailed: tPendingTranslation(
      "We couldn't save that change. Please try again.",
      'Generic fallback for an unexpected write failure on the manage page (not migration / quota / availability).',
      translationKey('Message.CustomDashboards.WriteFailed', TranslationNamespace.Analytics),
    ),
    storageNoticeQuotaExceeded: tPendingTranslation(
      "You've reached the custom dashboard limit. Delete a dashboard and try again.",
      'Write-failure notice shown on the manage page when the creator has reached the custom dashboard quota.',
      translationKey('Message.CustomDashboards.QuotaExceeded', TranslationNamespace.Analytics),
    ),
    storageNoticePermissionDenied: tPendingTranslation(
      "You don't have permission to change custom dashboards for this experience.",
      'Write-failure notice shown on the manage page when the current user lacks permission for custom dashboard mutations.',
      translationKey('Message.CustomDashboards.PermissionDenied', TranslationNamespace.Analytics),
    ),
    storageNoticeUnauthenticated: tPendingTranslation(
      'Sign in again to continue editing custom dashboards.',
      'Write-failure notice shown on the manage page when the current session is not authenticated.',
      translationKey('Message.CustomDashboards.Unauthenticated', TranslationNamespace.Analytics),
    ),
    storageNoticeVersionConflict: tPendingTranslation(
      'This dashboard was updated elsewhere. Refresh and try again.',
      'Write-failure notice shown on the manage page when a custom dashboard mutation loses an optimistic-concurrency race.',
      translationKey('Message.CustomDashboards.VersionConflict', TranslationNamespace.Analytics),
    ),
    storageNoticeValidationFailed: tPendingTranslation(
      "That dashboard couldn't be saved. Check the fields and try again.",
      'Write-failure notice shown on the manage page when the backend rejects custom dashboard validation.',
      translationKey('Message.CustomDashboards.ValidationFailed', TranslationNamespace.Analytics),
    ),

    deleteDialogTitle: tPendingTranslation(
      'Delete dashboard?',
      'Title for the confirmation dialog shown when the user picks Delete in the per-row overflow menu.',
      translationKey('Dialog.CustomDashboards.Delete.Title', TranslationNamespace.Analytics),
    ),
    deleteDialogBody: (args: { name: string }) =>
      tPendingTranslation(
        'Dashboard "{name}" will be permanently deleted. This action cannot be undone.',
        'Body copy for the delete-dashboard confirmation dialog. {name} is the dashboard name and is interpolated verbatim.',
        translationKey('Dialog.CustomDashboards.Delete.Body', TranslationNamespace.Analytics),
        args,
      ),
    deleteDialogConfirmLabel: tPendingTranslation(
      'Delete',
      'Action label for deleting a custom dashboard.',
      translationKey('Action.CustomDashboards.Delete', TranslationNamespace.Analytics),
    ),
    deleteDialogCancelLabel: tPendingTranslation(
      'Cancel',
      'Button label for canceling the current action.',
      translationKey('Action.Cancel', TranslationNamespace.Analytics),
    ),
    deleteDialogCloseLabel: tPendingTranslation(
      'Close',
      'Close dialog',
      translationKey('Action.Close', TranslationNamespace.Analytics),
    ),

    renameDialogTitle: tPendingTranslation(
      'Rename dashboard',
      'Title for the dialog that lets the user rename a dashboard from the manage-page row menu.',
      translationKey('Dialog.CustomDashboards.Rename.Title', TranslationNamespace.Analytics),
    ),
    renameDialogFieldLabel: tPendingTranslation(
      'Dashboard name',
      'Label for the text input inside the rename-dashboard dialog.',
      translationKey('Dialog.CustomDashboards.Rename.FieldLabel', TranslationNamespace.Analytics),
    ),
    renameDialogPlaceholder: tPendingTranslation(
      'Dashboard name',
      'Placeholder for the rename-dashboard text input when the field is empty.',
      translationKey('Dialog.CustomDashboards.Rename.Placeholder', TranslationNamespace.Analytics),
    ),
    renameDialogConfirmLabel: tPendingTranslation(
      'Save',
      'Primary confirm button on the rename-dashboard dialog.',
      translationKey('Action.Save', TranslationNamespace.Analytics),
    ),
    renameDialogCancelLabel: tPendingTranslation(
      'Cancel',
      'Button label for canceling the current action.',
      translationKey('Action.Cancel', TranslationNamespace.Analytics),
    ),
    renameDialogCloseLabel: tPendingTranslation(
      'Close',
      'Close dialog',
      translationKey('Action.Close', TranslationNamespace.Analytics),
    ),
    renameValidationRequired: tPendingTranslation(
      'Enter a name for this dashboard.',
      'Inline validation message under the rename-dashboard text input when the field is empty after trimming.',
      translationKey('Validation.CustomDashboards.Rename.Required', TranslationNamespace.Analytics),
    ),
    renameValidationTooLong: (args: { max: string }) =>
      tPendingTranslation(
        'Dashboard name cannot exceed {max} characters.',
        'Inline validation message under the rename-dashboard text input when the value exceeds the maximum length. {max} is the integer length cap.',
        translationKey(
          'Validation.CustomDashboards.Rename.TooLong',
          TranslationNamespace.Analytics,
        ),
        args,
      ),
    renameValidationBlocked: tPendingTranslation(
      'This name contains words that aren’t allowed. Please choose a different name.',
      'Error shown below the formula name input when the entered name fails text moderation (e.g. profanity).',
      translationKey('Error.ExploreMode.FormulaNameBlocked', TranslationNamespace.Analytics),
    ),
  };
}
export type ManagePageTranslations = ReturnType<typeof useManagePageTranslations>;
