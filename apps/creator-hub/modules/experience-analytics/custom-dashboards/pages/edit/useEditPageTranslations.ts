import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

/** Centralized editor-page translations; description strings stay for translators. */
function useEditPageTranslations() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return {
    unknownCreatorLabel: tPendingTranslation(
      'Unknown creator',
      'Fallback creator name shown when the custom dashboards API does not return a username.',
      translationKey('Label.CustomDashboards.UnknownCreator', TranslationNamespace.Analytics),
    ),
    publishButtonLabel: tPendingTranslation(
      'Publish',
      'Primary action in the editor header that promotes the working copy to a published dashboard.',
      translationKey('Action.Publish', TranslationNamespace.Analytics),
    ),
    publicationErrorLabel: tPendingTranslation(
      "Couldn't save this dashboard. Try again.",
      'Inline error shown in the editor header when saving a custom dashboard fails.',
      translationKey('Error.CustomDashboards.SaveFailed', TranslationNamespace.Analytics),
    ),
    publicationPermissionDeniedErrorLabel: tPendingTranslation(
      "You don't have permission to save this dashboard.",
      'Inline error shown in the editor header when saving fails because the current user lacks permission.',
      translationKey('Error.CustomDashboards.SavePermissionDenied', TranslationNamespace.Analytics),
    ),
    publicationUnauthenticatedErrorLabel: tPendingTranslation(
      'Sign in again to save this dashboard.',
      'Inline error shown in the editor header when saving fails because the current session is unauthenticated.',
      translationKey('Error.CustomDashboards.SaveUnauthenticated', TranslationNamespace.Analytics),
    ),
    publicationUnavailableErrorLabel: tPendingTranslation(
      "Custom dashboards can't be saved right now. Try again later.",
      'Inline error shown in the editor header when the selected custom-dashboards backend is unavailable.',
      translationKey('Error.CustomDashboards.SaveUnavailable', TranslationNamespace.Analytics),
    ),
    publicationQuotaExceededErrorLabel: tPendingTranslation(
      "You've reached the custom dashboard limit. Delete a dashboard and try again.",
      'Inline error shown in the editor header when saving a dashboard would exceed the custom dashboard quota.',
      translationKey('Error.CustomDashboards.SaveQuotaExceeded', TranslationNamespace.Analytics),
    ),
    publicationValidationErrorLabel: tPendingTranslation(
      "That dashboard couldn't be saved. Check the fields and try again.",
      'Inline error shown in the editor header when the backend rejects dashboard validation.',
      translationKey('Error.CustomDashboards.SaveValidationFailed', TranslationNamespace.Analytics),
    ),
    publicationConflictErrorLabel: tPendingTranslation(
      'This dashboard was updated elsewhere. Review the latest version and try again.',
      'Inline error shown in the editor header when a save loses an optimistic-concurrency race outside the main conflict dialog.',
      translationKey('Error.CustomDashboards.SaveConflict', TranslationNamespace.Analytics),
    ),
    cancelButtonLabel: tPendingTranslation(
      'Cancel',
      'Button label for canceling the current action.',
      translationKey('Action.Cancel', TranslationNamespace.Analytics),
    ),
    saveChangesButtonLabel: tPendingTranslation(
      'Save',
      'Primary action in the editor header that persists unsaved dashboard edits.',
      translationKey('Action.CustomDashboards.Editor.SaveChanges', TranslationNamespace.Analytics),
    ),
    previewButtonLabel: tPendingTranslation(
      'Preview',
      'Header action that opens the read-only preview of the working copy. Disabled in the M1 skeleton.',
      translationKey('Action.CustomDashboards.Preview', TranslationNamespace.Analytics),
    ),

    unsavedChangesLabel: tPendingTranslation(
      'Unsaved changes',
      'Indicator next to the dashboard name when explicit-save mode has unpersisted dashboard edits.',
      translationKey('Status.CustomDashboards.UnsavedChanges', TranslationNamespace.Analytics),
    ),

    renameDashboardLabel: tPendingTranslation(
      'Rename dashboard',
      'Accessible label for the pencil icon button next to the dashboard name in the editor header. Activating it puts the title into rename mode (lands in Phase D — disabled in M1).',
      translationKey('Action.CustomDashboards.Editor.Rename', TranslationNamespace.Analytics),
    ),
    createdBySubtitle: (createdBy: string) =>
      tPendingTranslation(
        'Created by {createdBy}',
        'Subtitle line beneath the dashboard name in the editor header. Identifies the original author by username; the value is interpolated client-side, so the placeholder must appear verbatim.',
        translationKey('Label.CustomDashboards.Editor.CreatedBy', TranslationNamespace.Analytics),
        { createdBy },
      ),

    addSummaryCardPlaceholderLabel: tPendingTranslation(
      'Add summary card',
      'Label on the in-canvas placeholder cell at the start of the summary-cards row. The plus icon button beneath the label opens the chart editor stub for a new summary card.',
      translationKey(
        'Action.CustomDashboards.Editor.AddSummaryCardPlaceholder',
        TranslationNamespace.Analytics,
      ),
    ),
    addSummaryCardDialogTitle: tPendingTranslation(
      'Add summary card',
      'Title for the modal dialog that creates a new summary card in the custom dashboard editor.',
      translationKey(
        'Dialog.CustomDashboards.AddSummaryCard.Title',
        TranslationNamespace.Analytics,
      ),
    ),
    editSummaryCardDialogTitle: tPendingTranslation(
      'Edit summary card',
      'Title for the modal dialog that edits an existing summary card in the custom dashboard editor.',
      translationKey(
        'Dialog.CustomDashboards.EditSummaryCard.Title',
        TranslationNamespace.Analytics,
      ),
    ),
    addSummaryCardDialogCloseLabel: tPendingTranslation(
      'Close add summary card dialog',
      'Accessible label for the close affordance on the add-summary-card modal dialog.',
      translationKey(
        'Action.CustomDashboards.AddSummaryCard.Close',
        TranslationNamespace.Analytics,
      ),
    ),
    addSummaryCardTitleLabel: tPendingTranslation(
      'Title',
      'Label for the optional title input in the add-summary-card modal dialog.',
      translationKey('Label.CustomDashboards.AddSummaryCard.Title', TranslationNamespace.Analytics),
    ),
    addSummaryCardTitlePlaceholder: tPendingTranslation(
      'Enter a title',
      'Placeholder for the optional title input in the add-summary-card modal dialog.',
      translationKey(
        'Placeholder.CustomDashboards.AddSummaryCard.Title',
        TranslationNamespace.Analytics,
      ),
    ),
    addSummaryCardMetricPlaceholder: tPendingTranslation(
      'Select a metric',
      'Placeholder for the metric selector in the add-summary-card modal dialog.',
      translationKey(
        'Placeholder.CustomDashboards.AddSummaryCard.Metric',
        TranslationNamespace.Analytics,
      ),
    ),
    addSummaryCardAddLabel: tPendingTranslation(
      'Add',
      'Primary action in the add-summary-card modal dialog that adds the configured summary card to the dashboard.',
      translationKey('Action.CustomDashboards.AddSummaryCard.Add', TranslationNamespace.Analytics),
    ),
    editSummaryCardSaveLabel: tPendingTranslation(
      'Save',
      'Primary action in the edit-summary-card modal dialog that saves the updated summary card.',
      translationKey(
        'Action.CustomDashboards.EditSummaryCard.Save',
        TranslationNamespace.Analytics,
      ),
    ),
    addSummaryCardCancelLabel: tPendingTranslation(
      'Cancel',
      'Secondary action in the add-summary-card modal dialog that closes the dialog without adding a summary card.',
      translationKey(
        'Action.CustomDashboards.AddSummaryCard.Cancel',
        TranslationNamespace.Analytics,
      ),
    ),
    addChartPlaceholderHeadline: tPendingTranslation(
      'Add charts to customize your dashboard',
      'Headline on the in-canvas placeholder card that invites the creator to add charts while editing a custom dashboard.',
      translationKey(
        'Heading.CustomDashboards.Editor.AddChartPlaceholder',
        TranslationNamespace.Analytics,
      ),
    ),
    addChartPlaceholderDescription: tPendingTranslation(
      'Build, manage, and edit customized dashboards.',
      'Sub-heading describing the custom-dashboards manage page. Followed in the UI by an inline "Learn more" link.',
      translationKey('Description.CustomDashboards.Manage', TranslationNamespace.Analytics),
    ),
    addChartPlaceholderLearnMoreLabel: tPendingTranslation(
      'Learn more',
      'Inline link in the manage-page subtitle that opens the documentation.',
      translationKey('Action.LearnMore', TranslationNamespace.Analytics),
    ),
    addChartPlaceholderButtonLabel: tPendingTranslation(
      'Add chart',
      'Primary call-to-action button inside the in-canvas empty-state placeholder that opens the chart editor for a new chart tile.',
      translationKey('Action.CustomDashboards.Editor.AddChart', TranslationNamespace.Analytics),
    ),
    canvasIllustrationLabel: tPendingTranslation(
      'Stylised dashboard tile illustration',
      "Accessible label for the editor canvas's decorative empty-chart illustration. Reuses the manage-page tilted-square + bar-chart artwork.",
      translationKey(
        'Label.CustomDashboards.Editor.EmptyChartIllustration',
        TranslationNamespace.Analytics,
      ),
    ),
    canvasContainerLabel: tPendingTranslation(
      'Dashboard canvas',
      'Accessible label for the dashed outer container that wraps the summary row + chart canvas in the editor.',
      translationKey(
        'Label.CustomDashboards.Editor.CanvasContainer',
        TranslationNamespace.Analytics,
      ),
    ),
    summaryRowLabel: tPendingTranslation(
      'Summary cards',
      'Accessible label for the horizontal row of summary cards across the top of the editor canvas.',
      translationKey('Label.CustomDashboards.Editor.SummaryRow', TranslationNamespace.Analytics),
    ),
    chartCanvasLabel: tPendingTranslation(
      'Charts',
      'Accessible label for the editor canvas region below the summary row that holds the chart tiles.',
      translationKey('Label.CustomDashboards.Editor.ChartCanvas', TranslationNamespace.Analytics),
    ),
    tileOverflowMenuLabel: tPendingTranslation(
      'Tile actions',
      'Accessible label for the per-tile overflow menu in the custom dashboard editor canvas.',
      translationKey('Label.CustomDashboards.Editor.TileActions', TranslationNamespace.Analytics),
    ),
    tileMenuEdit: tPendingTranslation(
      'Edit',
      'Per-row action menu item that navigates to the dashboard editor.',
      translationKey('Action.Edit', TranslationNamespace.Analytics),
    ),
    tileMenuDuplicate: tPendingTranslation(
      'Duplicate',
      'Menu item that duplicates the selected custom dashboard tile.',
      translationKey('Action.Duplicate', TranslationNamespace.Analytics),
    ),
    tileMenuRemove: tPendingTranslation(
      'Delete',
      'Menu item that deletes the selected tile from the custom dashboard editor canvas.',
      translationKey('Action.Delete', TranslationNamespace.Analytics),
    ),
    summaryCardSelectLabel: tPendingTranslation(
      'Select summary card',
      'Accessible label for a summary-card tile in the custom dashboard editor canvas. The tile can be selected for keyboard deletion.',
      translationKey(
        'Action.CustomDashboards.Editor.SelectSummaryCard',
        TranslationNamespace.Analytics,
      ),
    ),
    chartTileSelectLabel: tPendingTranslation(
      'Select chart tile',
      'Accessible label for a chart tile in the custom dashboard editor canvas. The tile can be selected for keyboard commands like copy, paste, and delete.',
      translationKey(
        'Action.CustomDashboards.Editor.SelectChartTile',
        TranslationNamespace.Analytics,
      ),
    ),

    loadErrorHeadline: tPendingTranslation(
      "We couldn't load this dashboard.",
      'Headline shown in the editor when the single-document load query fails. Distinct from the manage-page list-error copy because the action available here is "try again", not "refresh the whole list".',
      translationKey('Message.CustomDashboards.Editor.LoadError', TranslationNamespace.Analytics),
    ),
    loadErrorRetryLabel: tPendingTranslation(
      'Try again',
      'Button in the editor load-error state that re-runs the document query.',
      translationKey('Action.CustomDashboards.Editor.RetryLoad', TranslationNamespace.Analytics),
    ),

    notFoundHeadline: tPendingTranslation(
      "This dashboard doesn't exist.",
      "Headline shown in the editor when the requested dashboard id was not found in the user's storage (deleted in another tab, or a stale link).",
      translationKey('Message.CustomDashboards.Editor.NotFound', TranslationNamespace.Analytics),
    ),
    notFoundDescription: tPendingTranslation(
      'It may have been deleted from another tab. Return to your dashboards to start over.',
      'Description shown beneath the editor not-found headline. The "another tab" framing reflects the cross-tab service subscription that surfaces deletes synchronously.',
      translationKey(
        'Description.CustomDashboards.Editor.NotFound',
        TranslationNamespace.Analytics,
      ),
    ),
    notFoundCtaLabel: tPendingTranslation(
      'Back to dashboards',
      'Primary call-to-action in the editor not-found state that navigates back to the manage page.',
      translationKey('Action.CustomDashboards.Editor.BackToManage', TranslationNamespace.Analytics),
    ),

    notAvailableHeadline: tPendingTranslation(
      "Custom dashboards aren't available right now.",
      'Headline shown in the editor when the selected custom-dashboards backend is unavailable. Mirrors the manage-page wording so creators get a consistent message across surfaces.',
      translationKey(
        'Message.CustomDashboards.Editor.NotAvailable',
        TranslationNamespace.Analytics,
      ),
    ),
    serverEditBlockedHeadline: tPendingTranslation(
      'Edit this dashboard as a local copy.',
      'Headline shown to internal users who manually open the edit URL for a server-backed dashboard.',
      translationKey(
        'Message.CustomDashboards.Editor.ServerEditBlocked',
        TranslationNamespace.Analytics,
      ),
    ),
    serverEditBlockedDescription: tPendingTranslation(
      'Server dashboards are read-only in the internal sandbox. Go back and choose “Edit as local copy” to create a browser-local version.',
      'Description shown to internal users when direct editing of a server-backed dashboard is blocked.',
      translationKey(
        'Description.CustomDashboards.Editor.ServerEditBlocked',
        TranslationNamespace.Analytics,
      ),
    ),
    serverEditBlockedCtaLabel: tPendingTranslation(
      'Back to dashboards',
      'Button label for returning to the manage page after direct editing of a server-backed dashboard is blocked.',
      translationKey(
        'Action.CustomDashboards.Editor.ServerEditBlockedBack',
        TranslationNamespace.Analytics,
      ),
    ),

    chartEditorBackLabel: tPendingTranslation(
      'Back to dashboard',
      'Back-link label on the chart-editor sub-route that returns the user to the dashboard editor canvas.',
      translationKey('Action.CustomDashboards.ChartEditor.Back', TranslationNamespace.Analytics),
    ),
    chartEditorHeadline: tPendingTranslation(
      'Edit chart',
      'Page title when editing an existing chart tile on the chart-editor sub-route.',
      translationKey('Heading.CustomDashboards.ChartEditor.Edit', TranslationNamespace.Analytics),
    ),
    chartEditorAddHeadline: tPendingTranslation(
      'Add chart',
      'Page title when creating a new chart tile on the chart-editor sub-route.',
      translationKey('Heading.CustomDashboards.ChartEditor.Add', TranslationNamespace.Analytics),
    ),
    chartEditorLoadingLabel: tPendingTranslation(
      'Loading chart editor…',
      'Status text shown while the chart-editor route loads the dashboard document.',
      translationKey('Status.CustomDashboards.ChartEditor.Loading', TranslationNamespace.Analytics),
    ),
    chartEditorSaveLabel: tPendingTranslation(
      'Save',
      'Primary action that persists the chart tile and returns to the layout editor.',
      translationKey('Action.CustomDashboards.ChartEditor.Save', TranslationNamespace.Analytics),
    ),
    chartEditorTitleLabel: tPendingTranslation(
      'Chart title',
      'Label for the optional custom title field in the custom dashboard chart editor.',
      translationKey(
        'Label.CustomDashboards.ChartEditor.ChartTitle',
        TranslationNamespace.Analytics,
      ),
    ),
    chartEditorTitlePlaceholder: tPendingTranslation(
      'Use default metric title',
      'Placeholder for the optional custom chart title field when no title override is entered.',
      translationKey(
        'Placeholder.CustomDashboards.ChartEditor.ChartTitle',
        TranslationNamespace.Analytics,
      ),
    ),
    tileTitleBlockedError: tPendingTranslation(
      'This name contains words that aren’t allowed. Please choose a different name.',
      'Error shown below the formula name input when the entered name fails text moderation (e.g. profanity).',
      translationKey('Error.ExploreMode.FormulaNameBlocked', TranslationNamespace.Analytics),
    ),
    chartEditorSelectMetricHint: tPendingTranslation(
      'Select a metric to preview this chart.',
      'Hint shown in the chart-editor preview pane before the user has chosen a metric.',
      translationKey(
        'Description.CustomDashboards.ChartEditor.SelectMetric',
        TranslationNamespace.Analytics,
      ),
    ),
    chartEditorSaveErrorLabel: tPendingTranslation(
      "We couldn't save this chart. Try again.",
      'Inline error when persisting a chart tile from the chart editor fails.',
      translationKey(
        'Message.CustomDashboards.ChartEditor.SaveError',
        TranslationNamespace.Analytics,
      ),
    ),
    chartEditorTileNotFoundHeadline: tPendingTranslation(
      "This chart doesn't exist.",
      'Headline when the chart-editor route references a tile id that is not in the dashboard body.',
      translationKey(
        'Message.CustomDashboards.ChartEditor.TileNotFound',
        TranslationNamespace.Analytics,
      ),
    ),
    chartEditorMaxTilesError: tPendingTranslation(
      'This dashboard has reached the maximum number of chart tiles.',
      'Inline error shown when the user tries to add a chart tile but the dashboard already has the maximum number of chart tiles.',
      translationKey(
        'Error.CustomDashboards.ChartEditor.MaxChartTiles',
        TranslationNamespace.Analytics,
      ),
    ),
    chartEditorMissingTileIdError: tPendingTranslation(
      'Missing tile id for chart update.',
      'Inline error when saving an existing chart tile without a persisted tile id.',
      translationKey(
        'Error.CustomDashboards.ChartEditor.MissingTileId',
        TranslationNamespace.Analytics,
      ),
    ),
    conflictDialogTitle: tPendingTranslation(
      'This dashboard was updated elsewhere',
      'Title for the dialog shown when saving an edited dashboard fails because another writer saved first.',
      translationKey('Dialog.CustomDashboards.EditConflict.Title', TranslationNamespace.Analytics),
    ),
    conflictDialogBody: tPendingTranslation(
      'Someone else saved changes to this dashboard before you. Revert to load their version, save your edits as a new dashboard, or overwrite their changes with yours.',
      'Body copy for the edit-conflict dialog explaining the three recovery options.',
      translationKey('Dialog.CustomDashboards.EditConflict.Body', TranslationNamespace.Analytics),
    ),
    conflictDialogCloseLabel: tPendingTranslation(
      'Close edit conflict dialog',
      'Accessible label for the close affordance on the edit-conflict dialog.',
      translationKey('Action.CustomDashboards.EditConflict.Close', TranslationNamespace.Analytics),
    ),
    conflictDialogRevertLabel: tPendingTranslation(
      'Revert my changes',
      'Secondary action that discards the local edit draft and reloads the latest saved dashboard.',
      translationKey('Action.CustomDashboards.EditConflict.Revert', TranslationNamespace.Analytics),
    ),
    conflictDialogSaveAsNewLabel: tPendingTranslation(
      'Save as new dashboard',
      'Action that publishes the local edit draft as a separate dashboard copy.',
      translationKey(
        'Action.CustomDashboards.EditConflict.SaveAsNew',
        TranslationNamespace.Analytics,
      ),
    ),
    conflictDialogOverwriteLabel: tPendingTranslation(
      'Overwrite saved version',
      'Primary action that replaces the latest saved dashboard with the local edit draft.',
      translationKey(
        'Action.CustomDashboards.EditConflict.Overwrite',
        TranslationNamespace.Analytics,
      ),
    ),
  };
}

export default useEditPageTranslations;
export type EditPageTranslations = ReturnType<typeof useEditPageTranslations>;
