import { makeStyles } from '@rbx/ui';

const useShareLinkDialogStyles = makeStyles()(() => ({
  helperText: {
    paddingLeft: 14,
    gridArea: 'helper',
  },
  shareLinkResult: {
    marginTop: 12,
    '& input.Mui-disabled': {
      color: 'green',
    },
  },
  dialogSpacing: {
    paddingBottom: 16,
  },
}));

export default useShareLinkDialogStyles;
