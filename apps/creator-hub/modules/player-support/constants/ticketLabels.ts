import {
  CreatorTicketReadFilter,
  TicketCategory,
  TicketStatus,
} from '@modules/clients/creatorCommunication';

export const TICKET_CATEGORY_TRANSLATION_KEY = {
  [TicketCategory.BugReport]: 'Label.TicketCategory.BugReport',
  [TicketCategory.DataRestoreRequest]: 'Label.TicketCategory.DataRestoreRequest',
  [TicketCategory.PurchasingIssue]: 'Label.TicketCategory.PurchasingIssue',
  [TicketCategory.Other]: 'Label.TicketCategory.Other',
} as const satisfies Partial<Record<TicketCategory, string>>;

export const hasTicketCategoryTranslationKey = (
  category: string,
): category is keyof typeof TICKET_CATEGORY_TRANSLATION_KEY =>
  category in TICKET_CATEGORY_TRANSLATION_KEY;

/**
 * Labels for the CSV export, which stays English so it remains machine-parseable
 * whatever the creator's locale. Keep these in step with the English strings behind
 * the matching translation keys in Translations Hub.
 */
export const TICKET_CATEGORY_EXPORT_LABEL: Partial<Record<TicketCategory, string>> = {
  [TicketCategory.BugReport]: 'Bug Report',
  [TicketCategory.DataRestoreRequest]: 'Data Restore Request',
  [TicketCategory.PurchasingIssue]: 'Purchasing Issue',
  [TicketCategory.Other]: 'Other',
};

/** `Label.TicketStatus.Archived` and `Label.TicketStatus.NeedsAction`. */
export const TICKET_STATUS_EXPORT_LABEL: Partial<Record<TicketStatus, string>> = {
  [TicketStatus.Archived]: 'Archived',
  [TicketStatus.NeedsAction]: 'Needs Action',
};

/**
 * Keyed by the View filter creators use to narrow the list by this flag, so the export
 * and the filter cannot drift apart. `Invalid` is the unset filter and has no label.
 */
export const TICKET_VIEWED_EXPORT_LABEL: Partial<Record<CreatorTicketReadFilter, string>> = {
  [CreatorTicketReadFilter.Read]: 'Read',
  [CreatorTicketReadFilter.Unread]: 'Unread',
};
