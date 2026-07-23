import type {
  ClaimContentContentTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
} from '@rbx/client-rights/v1';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';

export type ItemInfo = { itemId: number; itemType: ClaimContentContentTypeEnum };

export enum ClaimContentRole {
  Infringing = 'infringing',
  Original = 'original',
}

export type ContentInfo = {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  originalLink: string;
};

export type TakedownRequest = {
  creationSource: ClaimItemSourceEnum;
  infringingContent: ContentInfo;
  myContent?: ContentInfo;
  description: string;
  supportingFiles: Doc[];
  key: string;
  discoveredFrom: ClaimItemDiscoveredFromEnum;
};

export type ClaimRequest = TakedownRequest;
