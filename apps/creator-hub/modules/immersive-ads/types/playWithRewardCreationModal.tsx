export enum PlayWithRewardCreationModalFormField {
  PRODUCT_ID = 'productId',
  FREQUENCY_CAP = 'frequencyCap',
  ACKNOWLEDGE_CHECKBOX = 'acknowledgeCheckbox',
  MODERATOR_NOTE = 'moderatorNote',
}
export interface PlayWithRewardFormValues {
  [PlayWithRewardCreationModalFormField.PRODUCT_ID]: number;
  [PlayWithRewardCreationModalFormField.FREQUENCY_CAP]: number;
  [PlayWithRewardCreationModalFormField.ACKNOWLEDGE_CHECKBOX]: boolean;
  [PlayWithRewardCreationModalFormField.MODERATOR_NOTE]?: string;
}
