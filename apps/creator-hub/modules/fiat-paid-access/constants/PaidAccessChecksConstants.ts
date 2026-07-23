export interface EligibilityCheckIntlKeyProps {
  title: string;
  description: string;
  titleShort: string;
  descriptionShort: string;
  buttonText: string;
}

export enum EligibilityCheckType {
  IDVerification = 'IDVerification',
  EmailVerification = 'EmailVerification',
  ModerationHistory = 'ModerationHistory',
  ConnectTipalti = 'ConnectTipalti',
}

export interface EligibilityCheckProps {
  isVerified: boolean;
  verifyLink: undefined | (() => void);
}

export const EligibilityCheckIntlKeys = new Map<EligibilityCheckType, EligibilityCheckIntlKeyProps>(
  [
    [
      EligibilityCheckType.IDVerification,
      {
        title: 'Title.IDVerification',
        description: 'Description.IDVerification',
        titleShort: 'Title.IDVerificationShort',
        descriptionShort: 'Description.IDVerification',
        buttonText: 'Label.VerifyID',
      },
    ],
    [
      EligibilityCheckType.EmailVerification,
      {
        title: 'Title.EmailVerification',
        description: 'Description.EmailVerification',
        titleShort: 'Title.EmailVerificationShort',
        descriptionShort: 'Description.EmailVerification',
        buttonText: 'Label.VerifyEmail',
      },
    ],
    [
      EligibilityCheckType.ModerationHistory,
      {
        title: 'Title.CleanModHistory',
        description: 'Description.CleanModHistory',
        titleShort: 'Title.ModHistory',
        descriptionShort: 'Description.CleanModHistoryShort',
        buttonText: '',
      },
    ],
    [
      EligibilityCheckType.ConnectTipalti,
      {
        title: 'Title.ConnectTipalti',
        description: 'Description.ConnectTipalti',
        titleShort: 'Title.PaymentInformation',
        descriptionShort: 'Description.ConnectTipaltiShort',
        buttonText: 'Label.SendRequest',
      },
    ],
  ],
);
