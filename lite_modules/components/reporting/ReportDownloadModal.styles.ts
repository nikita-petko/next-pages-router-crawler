import { makeStyles } from '@rbx/ui';

const useReportDownloadStyles = makeStyles()((theme) => ({
  actionRow: {
    gap: 16,
    marginBottom: 0,
    marginTop: 8,
  },
  bottomMargin: {
    marginBottom: 10,
  },
  datePickerGroupSpace: {
    marginRight: 16,
  },

  datePickerRow: {
    flexWrap: 'wrap',
  },

  dialogRow: {
    alignItems: 'center',
    display: 'flex',
    marginBottom: 16,
    minHeight: 55,
    position: 'relative',
  },

  downloadSetting: {
    alignItems: 'center',
    display: 'flex',
    marginBottom: 0,
    minHeight: 55,
    position: 'relative',
  },

  fileTypeRow: {
    margin: theme.spacing(0, 0, 2.5, 0),
    marginTop: 10,
  },

  iconButton: {
    cursor: 'pointer',
  },

  infoRow: {
    alignItems: 'left',
    marginBottom: 16,
    position: 'relative',
  },

  loadingStyle: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: 150,
    justifyContent: 'center',
  },

  relativeLeftAligned: {
    left: 0,
    position: 'absolute',
  },

  relativeRightAligned: {
    position: 'absolute',
    right: 0,
  },

  reportTypeRow: {
    margin: theme.spacing(0, 0, 2.5, 0),
    marginTop: 10,
  },

  rightMargin: {
    marginRight: 10,
  },
}));

export default useReportDownloadStyles;
