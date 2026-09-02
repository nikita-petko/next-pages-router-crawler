import { makeStyles } from '@rbx/ui';

const useSelectionWarningDialogStyles = makeStyles()(() => ({
  warningList: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    margin: '0px',
    marginBlockStart: '-5px',
    marginBlockEnd: '-5px',
    '& li': {
      margin: '0px',
      padding: '0px',
    },
  },

  luauWarningList: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    margin: '0px',
    marginBlockStart: '-5px',
    marginBlockEnd: '12px',
    '& li': {
      margin: '0px',
      padding: '0px',
    },
    '& ~ *': {
      fontSize: '0.875rem',
      display: 'block',
      marginTop: '12px',
    },
  },

  warningListItem: {
    display: 'list-item',
    margin: '0px',
    padding: '0px',
    lineHeight: '1.2',
    paddingInlineStart: '0px',
    '& .MuiListItemText-primary': {
      fontSize: '1rem',
    },
  },

  acknowledgementCheckbox: {
    marginLeft: '0px',
    marginRight: 'auto',
    marginTop: '8px',
    '& .MuiSvgIcon-root': { fontSize: 24 },
  },

  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '1200px',
      width: '100%',
    },
  },

  warningBox: {
    marginTop: '0px',
    marginBottom: '18px',
  },

  learnMoreLink: {
    fontSize: '14px',
    color: 'white',
    alignSelf: 'flex-start',
    marginTop: '3px',
    whiteSpace: 'nowrap',
  },

  alertTitle: {
    marginTop: '2px',
    paddingBottom: '8px',
    fontSize: '1.125rem',
    fontWeight: 500,
  },
}));

export default useSelectionWarningDialogStyles;
