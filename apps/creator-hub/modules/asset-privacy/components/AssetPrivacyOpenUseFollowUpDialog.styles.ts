import { makeStyles } from '@rbx/ui';

const useAssetPrivacyOpenUseFollowUpDialogStyles = makeStyles()(() => ({
  sectionHeading: {
    marginBottom: 10,
    fontWeight: 600,
  },
  freeFormHeading: {
    marginTop: 24,
    marginBottom: 8,
    fontWeight: 600,
  },
  reasonRow: {
    alignItems: 'flex-start',
    marginLeft: 0,
    marginRight: 0,
    '&.MuiFormControlLabel-root': {
      marginLeft: -3,
    },
    '& .MuiCheckbox-root': {
      padding: '10px 10px 10px 0',
    },
    '& .MuiSvgIcon-root': {
      fontSize: 28,
      width: 28,
      height: 28,
    },
    '& .MuiFormControlLabel-label': {
      marginTop: 10,
    },
  },
  reasonList: {
    rowGap: 12,
  },
  dialogActions: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: 16,
    justifyContent: 'flex-start',
    padding: '16px 24px 24px',
    width: '100%',
  },
  submitButton: {
    minWidth: 100,
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 12,
    paddingBottom: 12,
  },
}));

export default useAssetPrivacyOpenUseFollowUpDialogStyles;
