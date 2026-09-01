import { makeStyles } from '@rbx/ui';

const listItemHeight = 72;

const useSupportedLanguageListStyles = makeStyles()((theme) => ({
  languageListItem: {
    cursor: 'pointer',
    backgroundColor: theme.palette.surface[200],
    marginBottom: theme.spacing(1),
  },

  autoTranslationStatus: {
    marginRight: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    boxSizing: 'border-box',
  },

  languageListItemPlaceHolder: {
    backgroundColor: theme.palette.surface[200],
    marginBottom: theme.spacing(1 / 2),
    height: `${listItemHeight}px`,
  },

  descriptionText: {
    marginRight: theme.spacing(1 / 3),
  },

  statusText: {
    marginRight: theme.spacing(0.5),
  },

  statusOnText: {
    color: `${theme.palette.actionV2.active.fill}`,
    fontWeight: 'bold',
  },

  statusOffText: {
    fontWeight: 'bold',
  },

  notAvailableWithInfo: {
    display: 'inline-flex',
    alignItems: 'flex-start',
    columnGap: theme.spacing(0.25),
    marginRight: theme.spacing(-1),
  },

  notAvailableInfoIcon: {
    color: theme.palette.content.muted,
    cursor: 'help',
    display: 'inline-flex',
    alignSelf: 'center',
  },

  imageAutoTranslationTooltip: {
    maxWidth: 200,
    padding: theme.spacing(1, 1.25),
  },

  imageAutoTranslationTooltipText: {
    display: 'block',
    color: theme.palette.common.black,
    fontSize: '0.8rem',
    lineHeight: 1.4,
    fontWeight: 400,
  },

  placeholder: {
    marginTop: theme.spacing(4),
  },

  loader: {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },

  wrapper: {
    display: 'inline-block',
    position: 'relative',
    width: '100%',
    transform: 'translateZ(0)',
  },

  overlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    background: 'transparent',
  },

  deletingOverlay: {
    background: 'rgba(34, 34, 34, 0.5)', // this equals to theme.palette.media.secondaryBackground with 0.5 alpha value
  },
}));

export default useSupportedLanguageListStyles;
