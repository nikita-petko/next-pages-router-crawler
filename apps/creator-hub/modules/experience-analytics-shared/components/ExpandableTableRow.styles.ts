import { makeStyles } from '@rbx/ui';

type ExpandableTableRowStylesProps = {
  hasContent: boolean;
};

const useExpandableTableRowStyles = makeStyles<ExpandableTableRowStylesProps>()((theme, props) => ({
  cellsWrapperRow: {
    '& > *': {
      borderBottom: props.hasContent ? 'unset' : 'none',
    },
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
  },

  contentWrapperRow: {
    padding: 0,
  },

  contentWrapper: {
    width: '100%',
    overflowY: 'auto',
  },
}));

export default useExpandableTableRowStyles;
