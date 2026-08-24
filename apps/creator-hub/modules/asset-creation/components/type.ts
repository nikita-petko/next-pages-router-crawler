export const CreateAssetRegisterOptions = {
  name: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 50,
  },
  description: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 1000,
  },
  file: { required: true },
};

export type AssetUploadFormType = {
  name: string;
  description: string;
  assetType: string;
  file: File | null;
  price: number;
};

export enum AssetUploadPollStatus {
  /** The operation finished and returned the created asset id. */
  Succeeded = 'Succeeded',
  /**
   * The operation was accepted (and any upload fee already charged) but had not finished by the
   * time the poll ran out of budget. Slow asset types — video transcodes in particular — routinely
   * outlive the polling window, and the upload still completes server-side afterwards.
   */
  Pending = 'Pending',
  /** The operation reported an error, which has already been surfaced to the creator. */
  Failed = 'Failed',
}

export type AssetUploadPollResult =
  | { status: AssetUploadPollStatus.Succeeded; assetId: number }
  | { status: AssetUploadPollStatus.Pending }
  | { status: AssetUploadPollStatus.Failed };
