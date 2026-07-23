export const RobloxEnvironment = {
  Sitetest1: 'sitetest1',
  Sitetest2: 'sitetest2',
  Sitetest3: 'sitetest3',
  Production: 'production',
} as const;

export const RobloxTarget = {
  Global: 'global',
  Luobu: 'luobu',
} as const;

export type TRobloxEnvironment = (typeof RobloxEnvironment)[keyof typeof RobloxEnvironment];
export type TRobloxTarget = (typeof RobloxTarget)[keyof typeof RobloxTarget];

export enum EStudioTaskType {
  Default = 'Default',
  ReturnFromLogin = 'ReturnFromLogin',
  EditPlace = 'EditPlace',
  ViewAsset = 'ViewAsset',
}

export type StudioDialogTranslationsMessageKeys =
  | 'CheckingStudio'
  | 'StartYourCreation'
  | 'OpenStudioError';
export type StudioDialogTranslationsActionKeys = 'DownloadStudio';
export type StudioDialogTranslations = Record<
  `Message.${StudioDialogTranslationsMessageKeys}` | `Action.${StudioDialogTranslationsActionKeys}`,
  string
>;

type Fetcher = () => Promise<string | undefined>;
export type StudioFetchers = Record<'userChannel', Fetcher>;

export type StudioDialogParams =
  | {
      task: EStudioTaskType.Default | EStudioTaskType.ReturnFromLogin;
    }
  | {
      task: EStudioTaskType.EditPlace;
      universeId: string;
      placeId: string;
    }
  | {
      task: EStudioTaskType.ViewAsset;
      assetId: string;
    };
export type StudioDialogEvents = 'startAttempt' | 'startSuccess' | 'download';
export type StudioDialogEventHandler = (
  params: StudioDialogParams,
  helpers?: { getDownloadCode: () => Promise<string | undefined> },
) => void;
export type StudioDialogErrorHandler = (error: Error, params: StudioDialogParams) => void;
export type StudioDialogEventHandlers = Partial<
  Record<StudioDialogEvents, StudioDialogEventHandler>
>;

export type TStudioProtocolScheme =
  | 'roblox-studio-sitetest3'
  | 'roblox-studio-sitetest2'
  | 'roblox-studio-sitetest1'
  | 'roblox-studio'
  | 'roblox-studio-qq';
export type TStudioDistributorType = 'Global';

export type TStudioProtocolParamsBase = {
  userId: string;
  locale: string;
  protocolScheme: TStudioProtocolScheme;
  distributorType: TStudioDistributorType;
  baseUrl?: string;
  channel: string;
  // Single-use magic authorization code for Web -> Studio auto-login. When set
  // and non-empty, the deeplink carries `+authCode:<code>+authCodeType:magic`
  // so Studio can redeem it and skip the login modal.
  authCode?: string;
};
