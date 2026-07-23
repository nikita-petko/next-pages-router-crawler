import { makeStyles } from '@rbx/ui';
import announcementMetadataStyles from './announcementMetadata.styles';

const useChangelogPostStyles = makeStyles()((theme) => ({
  ...announcementMetadataStyles(theme),
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    alignSelf: 'stretch',
    padding: '14px 0 0',
    border: 'none',
    background: 'transparent',
    maxWidth: 800,
  },
  title: {
    color: theme.palette.content.standard,
    fontFamily: '"Builder Sans"',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '120%',
    letterSpacing: '-0.24px',
    alignSelf: 'stretch',
    padding: 0,
  },
  metadataRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    aspectRatio: '1/1',
    color: theme.palette.content.muted,
  },
  takeaways: {
    display: 'flex',
    padding: '24px 20px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 20,
    alignSelf: 'stretch',
    borderRadius: 8,
    background:
      theme.palette.mode === 'dark' ? 'rgba(208, 217, 251, 0.04)' : 'rgba(32, 34, 39, 0.04)',
    marginTop: 12,
  },
  imageWrapper: {
    width: 'auto',
    maxWidth: '100%',
    alignSelf: 'flex-start',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    display: 'block',
    width: 'auto',
    maxWidth: '100%',
    maxHeight: 250,
    height: 'auto',
    objectFit: 'contain',
  },
  takeawaysTitle: {
    alignSelf: 'stretch',
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '-0.16px',
    color: theme.palette.content.standard,
  },
  takeawaysContent: {
    alignSelf: 'stretch',
    color: theme.palette.content.standard,
    fontFamily: 'var(--Config-Text-Font, "Builder Sans")',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '140%',
    whiteSpace: 'pre-line',
  },
  takeawaysContentRich: {
    whiteSpace: 'normal',
    '& p': {
      margin: '8px 0',
    },
    '& ul, & ol': {
      margin: '8px 0',
      paddingLeft: 16,
    },
    '& pre': {
      margin: '8px 0',
      padding: '8px 12px',
      borderRadius: 6,
      background: theme.palette.surface[200],
      overflowX: 'auto',
    },
    '& code': {
      fontFamily: 'monospace',
    },
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: 40,
  },
  actionButton: {
    cursor: 'pointer',
  },
  readActionButton: {
    height: 32,
    paddingLeft: 16,
    paddingRight: 16,
  },
  actionLabelSoft: {
    overflow: 'hidden',
    color: 'inherit',
    textAlign: 'center',
    fontFamily: '"Builder Sans"',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '100%',
  },
  postContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
}));

export default useChangelogPostStyles;
