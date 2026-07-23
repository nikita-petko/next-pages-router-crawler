import { makeStyles } from '@rbx/ui';

const useGenericTableBodyWrapperStyles = makeStyles<{ emptyStateTableHeight?: number }>()(
  (_, { emptyStateTableHeight }) => ({
    emptyState: {
      height: emptyStateTableHeight ? `${emptyStateTableHeight}px` : undefined,
    },
  }),
);

export default useGenericTableBodyWrapperStyles;
