import { makeStyles } from '@rbx/ui';

const paginationSize = '48px';

const usePaginationStyles = makeStyles()(() => ({
  root: {
    minHeight: paginationSize,
    margin: '8px 0px',
  },
}));

export default usePaginationStyles;
