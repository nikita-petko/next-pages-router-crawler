import type { LookDetailV2 } from '@rbx/client-look-api/v1';

export type LookSalesData = {
  isForSale: boolean;
  price: number | undefined;
};

const defaultSalesData: LookSalesData = {
  isForSale: false,
  price: 0,
};

export function getLookSalesData(lookDetail: LookDetailV2): LookSalesData {
  // TODO @mryumae/@vchandramouli: calculate isForSale
  return {
    ...defaultSalesData,
    price: lookDetail.totalPrice,
  };
}
