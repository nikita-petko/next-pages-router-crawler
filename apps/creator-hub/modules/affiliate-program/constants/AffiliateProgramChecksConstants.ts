import type { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';

export interface EligibilityCheckIntlKeyProps {
  title: string;
  titleShort: string;
  description: string;
  descriptionShort: string;
  buttonText: string;
  buttonTextVerified?: string;
}

export enum EligibilityCheckType {
  Id = 'Id',
  Moderation = 'Moderation',
}

export interface EligibilityCheckProps {
  status: EligibilityStatus;
  verifyLink?: () => void;
  isOpenInNewLink?: boolean;
}

export const EligibilityCheckIntlKeys = new Map<EligibilityCheckType, EligibilityCheckIntlKeyProps>(
  [
    [
      EligibilityCheckType.Id,
      {
        title: 'Title.VerifyId',
        titleShort: 'Title.VerifyIdShort',
        description: 'Description.VerifyId',
        descriptionShort: 'Description.VerifyIdShort',
        buttonText: 'Action.VerifyId',
      },
    ],
    [
      EligibilityCheckType.Moderation,
      {
        title: 'Title.ModerationHistory',
        titleShort: 'Title.ModerationHistoryShort',
        description: 'Description.ModerationHistory',
        descriptionShort: 'Description.ModerationHistoryShort',
        buttonText: '',
      },
    ],
  ],
);
