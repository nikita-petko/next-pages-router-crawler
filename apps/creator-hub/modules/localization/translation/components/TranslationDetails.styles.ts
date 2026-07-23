import { makeStyles } from '@rbx/ui';

const useTranslationDetailsStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(2, 0, 2, 0),
  },

  title: {
    width: '100%',
    marginBottom: theme.spacing(2 / 3),
  },

  titleWithTooltip: {
    marginBottom: theme.spacing(2 / 3),
    marginRight: 10,
  },

  text: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  },

  characterLeftText: {
    color: theme.palette.text.secondary,
  },

  unavailableText: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.disabled,
  },

  input: {
    background: theme.palette.media.secondaryBackground,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
  },

  rtlInput: {
    background: theme.palette.media.secondaryBackground,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
    direction: 'rtl',
  },

  tallInput: {
    background: theme.palette.media.secondaryBackground,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
    lineHeight: '2.0rem',
    fontSize: '1.3rem',
  },

  tallRtlInput: {
    background: theme.palette.media.secondaryBackground,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
    lineHeight: '2.0rem',
    fontSize: '1.3rem',
    direction: 'rtl',
  },

  denseInput: {
    background: theme.palette.media.secondaryBackground,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
    lineHeight: '1.4rem',
    letterSpacing: '0.1em',
  },

  denseRtlInput: {
    background: theme.palette.media.secondaryBackground,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
    lineHeight: '1.4rem',
    letterSpacing: '0.1em',
    direction: 'rtl',
  },

  icon: {
    margin: theme.spacing(2 / 3, 1, 0, 0),
  },
}));

export default useTranslationDetailsStyles;
