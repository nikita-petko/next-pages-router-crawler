import type {
  ClaimContentContentTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
  IPContent,
} from '@rbx/client-rights/v1';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';

export type ItemInfo = { itemId: number; itemType: ClaimContentContentTypeEnum };

export enum ClaimContentRole {
  Infringing = 'infringing',
  Original = 'original',
}

type ContentInfoBase = {
  contentType: ClaimContentContentTypeEnum;
  originalLink: string;
};

/** Stores standard asset IP content as original creation. */
export type ContentInfo = ContentInfoBase & {
  contentId: number;
  myTrademarkContent?: never;
};

/** Stores trademark IP content as original creation. */
type TrademarkContentInfo = ContentInfoBase & {
  contentId?: never;
  myTrademarkContent: IPContent;
};

type RequestBase = {
  creationSource: ClaimItemSourceEnum;
  infringingContent: ContentInfo;
  description: string;
  supportingFiles: Doc[];
  key: string;
  discoveredFrom: ClaimItemDiscoveredFromEnum;
};

// TODO: [CDS-1449] Simplify these request types once claims support trademarks in Creator Hub. (williamwu)
/** A removal request whose original content can be either asset or trademark content. */
export type TakedownRequest = RequestBase & {
  myContent?: ContentInfo | TrademarkContentInfo;
};

/** A claim request whose original content can currently only be asset content. */
export type ClaimRequest = RequestBase & {
  myContent?: ContentInfo;
};
