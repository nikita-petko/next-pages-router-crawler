/* istanbul ignore file */

import { makeStyles } from '@rbx/ui';

const useContentMetadataAppealDialogStyles = makeStyles()((theme) => ({
  dialogPaper: {
    width: '600px',
    maxWidth: 'none',
  },
  dialogContent: {
    width: '100%',
  },
  contentContainer: {
    padding: '0 10px 10px 10px',
    color: theme.palette.content.standard,
  },
  titleContainer: {
    textAlign: 'left' as const,
  },
  title: {
    fontSize: '20px',
    fontWeight: 450,
    marginBottom: '8px',
  },
  subtitleContainer: {
    textAlign: 'left' as const,
    marginBottom: '24px',
  },
  subtitle: {
    fontSize: '16px',
    color: theme.palette.content.muted,
  },
  divider: {
    margin: '24px 0',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.components.divider}`,
  },
  infoLabel: {
    fontWeight: 500,
    color: theme.palette.content.muted,
  },
  infoValue: {
    color: theme.palette.content.muted,
  },
}));

export default useContentMetadataAppealDialogStyles;
