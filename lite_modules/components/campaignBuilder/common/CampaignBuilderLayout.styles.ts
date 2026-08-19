import { makeStyles } from '@rbx/ui';

const useCampaignBuilderLayoutStyles = makeStyles()((theme) => ({
  footer: {
    backdropFilter: 'blur(25px)',
    // Keep the frosted treatment but make the footer opaque enough to fully mask
    // thumbnail overlays that scroll underneath (e.g. remove "X" controls).
    // `over-media-0` is the page surface at 92% alpha, so it tracks the theme.
    backgroundColor: 'var(--color-over-media-0)',
    bottom: 0,
    display: 'flex',
    gap: theme.spacing(1.5),
    // Sticky elements stack in normal flow unless z-index is set; raise the
    // footer above tile overlays so controls never float over Publish/Cancel.
    padding: `${theme.spacing(3)} 0`,
    position: 'sticky',
    zIndex: 10,
  },
}));

export default useCampaignBuilderLayoutStyles;
