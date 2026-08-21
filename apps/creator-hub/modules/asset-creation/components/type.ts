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
