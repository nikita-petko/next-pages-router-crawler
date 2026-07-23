import { makeStyles } from '@rbx/ui';

export const DEVELOPER_LANDING_HORIZONTAL_PADDING = { compact: 20, large: 200 };

const useDeveloperContainerStyles = makeStyles()(() => ({
  root: {
    padding: `0px ${DEVELOPER_LANDING_HORIZONTAL_PADDING.compact}px 150px`,
    width: '100vw',
    position: 'relative',
    overflowY: 'visible',
    display: 'flex',
    flexDirection: 'column',
  },

  fullWidthContainer: {
    margin: `0px -${DEVELOPER_LANDING_HORIZONTAL_PADDING.compact}px`,
  },
}));

export default useDeveloperContainerStyles;
