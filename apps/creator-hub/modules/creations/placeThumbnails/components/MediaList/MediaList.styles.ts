import { makeStyles } from '@rbx/ui';

const useMediaListStyles = makeStyles()((theme) => ({
  mediaListContainer: {
    padding: '0',
    marginTop: '0px',
  },
  listItem: {
    listStyle: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.components.divider}`,
    borderTop: `1px solid ${theme.palette.components.divider}`,
    height: '80px',
    marginTop: '-1px',
    padding: '8px 4px',
  },
  preview: {
    height: '100%',
    aspectRatio: '572 / 324',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  videoIFramePreview: {
    width: '572px',
  },
  inCompletePreview: {
    height: '100%',
    aspectRatio: '572 / 324',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.surface[400],
    borderRadius: 0,
  },
  inCompletePreviewIcon: {
    alignSelf: 'center',
    margin: 'auto',
  },
}));

export default useMediaListStyles;
