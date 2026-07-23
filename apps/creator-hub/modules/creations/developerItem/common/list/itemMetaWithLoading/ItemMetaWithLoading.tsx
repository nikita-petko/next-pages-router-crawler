import React, { FunctionComponent, ReactElement } from 'react';
import { Skeleton } from '@rbx/ui';
import useGridItemStyle from '../menuItems/useGridItemStyles';

export type TItemMetaWithLoadingProps = {
  isLoading?: boolean;
  width?: string | number;
  children: ReactElement;
};

const ItemMetaWithLoading: FunctionComponent<React.PropsWithChildren<TItemMetaWithLoadingProps>> = (
  props,
) => {
  const { children, isLoading = false, width } = props;
  const {
    classes: { meta },
  } = useGridItemStyle();
  return isLoading ? (
    <Skeleton data-testid='ItemMetaWithLoading__skeleton' width={width} />
  ) : (
    <div className={meta}>{children}</div>
  );
};

export default ItemMetaWithLoading;
