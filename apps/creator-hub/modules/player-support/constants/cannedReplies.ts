import { TicketCategory, TicketResponse } from '@modules/clients/creatorCommunication';

export interface CannedReply {
  value: TicketResponse;
  labelKey: string;
}

const CANNED_REPLIES = [
  {
    value: TicketResponse.ReportReceived,
    labelKey: 'Message.CannedResponse.ReportReceived',
  },
  {
    value: TicketResponse.IssueFixed,
    labelKey: 'Message.CannedResponse.IssueFixed',
  },
  {
    value: TicketResponse.AwareNoActionTaken,
    labelKey: 'Message.CannedResponse.AwareNoActionTaken',
  },
  {
    value: TicketResponse.RequestMoreDetails,
    labelKey: 'Message.CannedResponse.RequestMoreDetails',
  },
  {
    value: TicketResponse.ReportToCustomerService,
    labelKey: 'Message.CannedResponse.ReportToCustomerService',
  },
  {
    value: TicketResponse.RequestUserInformation,
    labelKey: 'Message.CannedResponse.RequestUserInformation',
  },
  {
    value: TicketResponse.MissingItemsAdded,
    labelKey: 'Message.CannedResponse.MissingItemsAdded',
  },
  {
    value: TicketResponse.DataRestored,
    labelKey: 'Message.CannedResponse.DataRestored',
  },
  {
    value: TicketResponse.UnableToRestoreData,
    labelKey: 'Message.CannedResponse.UnableToRestoreData',
  },
  {
    value: TicketResponse.UnableToTakeActionOnPurchase,
    labelKey: 'Message.CannedResponse.UnableToTakeActionOnPurchase',
  },
] as const satisfies readonly CannedReply[];

const REPLIES_BY_CATEGORY: Record<TicketCategory, readonly TicketResponse[]> = {
  [TicketCategory.BugReport]: [
    TicketResponse.IssueFixed,
    TicketResponse.RequestUserInformation,
    TicketResponse.AwareNoActionTaken,
    TicketResponse.RequestMoreDetails,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.DataRestoreRequest]: [
    TicketResponse.UnableToRestoreData,
    TicketResponse.RequestMoreDetails,
    TicketResponse.DataRestored,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.PurchasingIssue]: [
    TicketResponse.MissingItemsAdded,
    TicketResponse.UnableToTakeActionOnPurchase,
    TicketResponse.RequestMoreDetails,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.Other]: [
    TicketResponse.RequestMoreDetails,
    TicketResponse.ReportToCustomerService,
  ],
  [TicketCategory.Invalid]: [],
};

const CANNED_REPLIES_BY_VALUE = new Map<TicketResponse, CannedReply>(
  CANNED_REPLIES.map((reply) => [reply.value, reply]),
);

const FALLBACK_CATEGORY = TicketCategory.Other;

export const getCannedRepliesForCategory = (
  category: TicketCategory | undefined,
  includeRequestUserInformation = true,
): readonly CannedReply[] => {
  const normalizedCategory =
    category && category in REPLIES_BY_CATEGORY ? category : FALLBACK_CATEGORY;

  return REPLIES_BY_CATEGORY[normalizedCategory].flatMap((value) => {
    if (!includeRequestUserInformation && value === TicketResponse.RequestUserInformation) {
      return [];
    }

    const reply = CANNED_REPLIES_BY_VALUE.get(value);
    return reply ? [reply] : [];
  });
};
