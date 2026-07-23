import { makeStyles } from '@rbx/ui';

const textHeightForTranslator = 18;

const useReportDownloaderStyles = makeStyles()((theme) => ({
  descriptionText: {
    marginBottom: 20,
    color: theme.palette.text.secondary,
  },

  downloadButton: {
    marginTop: 20,
    marginBottom: theme.spacing(1),
  },

  errorText: {
    paddingLeft: theme.spacing(2 / 3),
    color: theme.palette.error.main,
  },

  translatorText: {
    marginBottom: 20,
  },

  loader: {
    marginLeft: theme.spacing(1 / 3),
  },
}));

export default useReportDownloaderStyles;
