import { makeStyles } from '@rbx/ui';

// In order to simulate the notification, styles are copied from www site,
// which are not following uiblox standard (color, padding, width, etc)
const useExperienceUpdatesPreviewStyles = makeStyles()((theme) => ({
  previewContainer: {
    marginTop: 48,
    marginBottom: 48,
    width: '100%',
  },

  previewSection: {
    marginTop: 24,
  },

  placeholderIconStyle: {
    height: '100%',
    padding: 9,
    display: 'inline-block',
  },

  desktopContent: {
    width: 421,
  },

  tabletContent: {
    width: 540,
  },

  phoneContent: {
    width: 332,
  },

  previewContent: {
    height: 68,
    marginTop: 12,
    backgroundColor: 'white',
    fontFamily: "'Source Sans Pro','Arial','Helvetica','sans-serif'",
    color: '#343434',
    fontSize: 14,
    lineHeight: 1.5,
    position: 'relative',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('Large')]: {
      maxWidth: '100%',
    },
  },

  experienceNameStyle: {
    color: '#00A2FF',
  },

  timeText: {
    color: '#B8B8B8',
    fontSize: 12,
    position: 'absolute',
    left: 9,
    bottom: 9,
  },

  updateInfoContainer: {
    display: 'inline-block',
    maxWidth: '70%',
    padding: 9,
    verticalAlign: 'top',
    lineHeight: 1.2,
    height: '100%',
    width: '100%',
    position: 'relative',
    whiteSpace: 'normal',
    overflow: 'auto',
  },

  updateTextContainer: {
    display: 'inline-block',
    height: '2.4em',
    overflow: 'hidden',
    width: '100%',
  },

  moreButton: {
    fontSize: 20,
    color: '#343434',
    position: 'absolute',
    right: 9,
    top: '50%',
    marginTop: '-0.5em',
  },

  playButton: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    color: '#ffffff',
    backgroundColor: '#02b757',
    fontSize: 12,
    padding: 4,
    borderRadius: 3,
    fontWeight: 500,
    border: 'none',
  },

  warningText: {
    marginTop: 4,
    marginLeft: 14,
    fontWeight: 'bold',
    fontSize: 12,
    color: theme.palette.warning.main,
  },
}));

export default useExperienceUpdatesPreviewStyles;
