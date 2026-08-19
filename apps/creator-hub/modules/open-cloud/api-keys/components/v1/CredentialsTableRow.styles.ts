import { makeStyles } from '@rbx/ui';

const useCredentialsTableRowStyles = makeStyles()(() => ({
  nameColumn: {
    /**
     * set a width of 50% on the first table column (the API key names). If we don't set a width, the table column widths
     * become elastic and will dynamically change length based on the longest API key name value. This visually looks
     * jarring, so by not allowing the column with the most variable length to move, the paging behavior looks nicer.
     */
    width: '40%',
  },

  actionsCell: {
    minWidth: '410px', // minimum cell width to prevent line-wrapping
    '& button': {
      margin: '0px 8px',
    },
  },
}));

export default useCredentialsTableRowStyles;
