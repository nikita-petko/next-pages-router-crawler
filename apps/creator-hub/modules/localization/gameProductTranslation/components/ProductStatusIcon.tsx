import React, { FunctionComponent } from 'react';
import { CheckIcon, CircularProgress, ScheduleIcon } from '@rbx/ui';
import ProductStatus from '../../translation/enums/TranslationStatus';

export interface ProductStatusProps {
  isLoading: boolean;
  status: ProductStatus | null;
}

const ProductStatusIcon: FunctionComponent<React.PropsWithChildren<ProductStatusProps>> = ({
  isLoading,
  status,
}) => {
  if (isLoading) {
    return <CircularProgress size={12} thickness={5} />;
  }
  if (status === ProductStatus.Done) {
    return <CheckIcon fontSize='small' />;
  }
  return <ScheduleIcon fontSize='small' />;
};

export default ProductStatusIcon;
