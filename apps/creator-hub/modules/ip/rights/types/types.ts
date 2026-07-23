import { ClaimContentContentTypeEnum } from '@rbx/clients/rightsV1';

export type ItemInfo = { itemId: number; itemType: ClaimContentContentTypeEnum };

export enum ClaimContentRole {
  Infringing = 'infringing',
  Original = 'original',
}
