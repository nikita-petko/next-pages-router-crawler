import type { TTheme } from '@rbx/ui';

/**
 * Shared metadata text styles for announcement/changelog content (likes, posts count).
 * Used by ChangelogPost and UpdatesTile.
 */
const announcementMetadataStyles = (theme: TTheme) => ({
  metadataText: {
    color: theme.palette.content.muted,
    fontFamily: '"Builder Sans"',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: '140%',
  },
});

export default announcementMetadataStyles;
