import { TicketCategory } from '@modules/clients/creatorCommunication';

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
