import { makeStyles } from '@rbx/ui';

const useBillingStatementServiceItemStyles = makeStyles()((theme) => {
  return {
    usageText: {
      paddingLeft: 16,
    },
    invoiceLines: {
      borderBottom: `solid 1px ${theme.palette.surface.outline}`,
      margin: '0 10px',
    },
    costBreakdownHeader: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      marginTop: 2,
    },
    costBreakdownResource: {
      paddingLeft: 32,
    },
    expandedIcon: {
      transform: 'rotate(180deg)',
      transition: 'transform 0.2s',
      color: 'inherit',
    },
    collapsedIcon: {
      transform: 'rotate(0deg)',
      transition: 'transform 0.2s',
      color: 'inherit',
    },
    iconButton: {
      color: 'inherit',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  };
});

export default useBillingStatementServiceItemStyles;
